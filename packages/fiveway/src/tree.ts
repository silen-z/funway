import { type NodeId, convergingPaths, idsToRoot, isParent } from "./id.js";
import type { DisconnectedNode, NavigationNode } from "./node.js";
import { type ListenerTree, callListeners } from "./events.js";
import { runHandler } from "./handler.js";
import { focusHandler } from "./handlers/focus.js";
import { binarySearch } from "./array.js";
import type { NavigationDirection } from "./navigation.js";

export type NavigationTree = {
  nodes: Map<NodeId, NavigationNode>;
  focusedId: NodeId;
  listeners: ListenerTree;
};

export function createNavigationTree(): NavigationTree {
  const tree = {
    focusedId: "#",
    nodes: new Map(),
    listeners: new Map(),
  };

  tree.nodes.set("#", {
    tree,
    id: "#",
    connected: true,
    parent: null,
    order: 0,
    handler: focusHandler(),
    children: [],
  });

  return tree;
}

// TODO split into insertNode/connectNode
export function insertNode(
  tree: NavigationTree,
  node: DisconnectedNode,
  notify = true
): NavigationNode {
  if (node.parent === null) {
    throw new Error("trying to connect root (or node without parent)");
  }

  const connnectedNode = node as NavigationNode;
  connnectedNode.tree = tree;

  if (!tree.nodes.has(node.parent)) {
    tree.nodes.set(node.id, connnectedNode);
    return connnectedNode;
  }

  const existingNode = tree.nodes.get(node.id);
  if (existingNode != null && existingNode.connected) {
    console.warn(`trying to connect existing node: ${node.id}`);
  }

  tree.nodes.set(node.id, connnectedNode);
  node.connected = true;

  // TODO preserving order probably depends on nodes Map being ordered
  // it would be better to handle that explicitly via sentinel nodes (with children)
  const parentNode = getNode(tree, node.parent);
  insertChildInOrder(parentNode, connnectedNode);

  // TODO optimize iteration through all nodes
  // either with sentinel nodes or just array of disconnected ids
  for (const n of tree.nodes.values()) {
    if (n.parent === node.id) {
      insertNode(tree, n, false);
    }
  }

  if (notify) {
    callListeners(tree, "#", "structurechange");

    if (tree.focusedId === "#" || isFocused(tree, node.parent)) {
      focusNode(tree, node.parent, { direction: "initial" });
    }
  }

  return connnectedNode;
}

export function removeNode(tree: NavigationTree, nodeId: NodeId) {
  if (nodeId === "#") {
    throw new Error("cannot remove root node");
  }

  const node = tree.nodes.get(nodeId);
  if (node == null) {
    return;
  }

  if (node.connected) {
    disconnectNode(tree, nodeId);
  }

  tree.nodes.delete(nodeId);
  callListeners(tree, "#", "structurechange");

  if (isFocused(tree, nodeId)) {
    idsToRoot(node.parent!, (id) => {
      const focused = focusNode(tree, id, { direction: "initial" });

      // if we managed to focus a node we can stop searching
      if (focused) {
        return false;
      }
    });
  }
}

function disconnectNode(tree: NavigationTree, nodeId: NodeId) {
  const node = tree.nodes.get(nodeId);
  if (node == null) {
    return;
  }

  // its fine if parent is already diconnected/removed
  const parentNode = tree.nodes.get(node.parent!);
  if (parentNode != null) {
    // tombstone id of removed node in parent
    const parentChildIndex = parentNode.children.findIndex(
      (child) => child.id === nodeId
    );
    if (parentChildIndex === -1) {
      console.error("encountered broken tree");
    }

    // remember the position if its not explicitly set
    if (node.order === null) {
      parentNode.children[parentChildIndex]!.active = false;
    } else {
      parentNode.children.splice(parentChildIndex, 1);
    }
  }

  for (const child of node.children) {
    disconnectNode(tree, child.id);
  }

  (node as DisconnectedNode).connected = false;
}

export type FocusOptions = {
  direction?: NavigationDirection | "initial";
};

export function focusNode(
  tree: NavigationTree,
  targetId: NodeId,
  options: FocusOptions = {}
) {
  const node = tree.nodes.get(targetId);
  if (node == null || !node.connected) {
    return false;
  }

  const resolvedId = runHandler(tree, targetId, {
    kind: "focus",
    direction: options.direction ?? null,
  });

  if (tree.focusedId === resolvedId) {
    return true;
  }

  if (resolvedId === null) {
    return false;
  }

  const lastFocused = tree.focusedId;
  tree.focusedId = resolvedId;

  convergingPaths(lastFocused, tree.focusedId, (id) => {
    callListeners(tree, id, "focuschange");
  });

  return true;
}

export function selectNode(
  tree: NavigationTree,
  nodeId: NodeId,
  focus: boolean = true
) {
  if (focus) {
    focusNode(tree, nodeId);
  }

  runHandler(tree, nodeId, { kind: "select" });
}

export function getNode(tree: NavigationTree, nodeId: NodeId): NavigationNode {
  const node = tree.nodes.get(nodeId);
  if (node == null) {
    throw new Error(`node '${nodeId}' does not exist`);
  }

  if (!node.connected) {
    throw new Error(`node '${nodeId}' not connected`);
  }

  return node;
}

export function isFocused(tree: NavigationTree, nodeId: NodeId): boolean {
  if (tree.focusedId === nodeId) {
    return true;
  }

  return isParent(nodeId, tree.focusedId);
}

export function traverseNodes(
  tree: NavigationTree,
  nodeId: NodeId,
  depth: number | null,
  callback: (id: NodeId) => void
) {
  if (depth === 0) {
    return;
  }

  const node = getNode(tree, nodeId);

  for (const child of node.children) {
    if (child.active) {
      callback(child.id);
      traverseNodes(
        tree,
        child.id,
        depth !== null ? depth - 1 : null,
        callback
      );
    }
  }
}

function insertChildInOrder(
  parentNode: NavigationNode,
  childNode: NavigationNode
) {
  const oldIndex = parentNode.children.findIndex(
    (child) => child.id === childNode.id
  );

  if (oldIndex !== -1) {
    if (childNode.order === null) {
      // if node doesn't have explicit order use the remembered position
      parentNode.children[oldIndex]!.active = true;
      return;
    }

    // otherwise remove the tobstone so it can be inserted again at correct index
    parentNode.children.splice(oldIndex, 1);
  }

  const newIndex = binarySearch(
    parentNode.children,
    (child) => (childNode.order ?? 0) < (child.order ?? 0)
  );

  parentNode.children.splice(newIndex, 0, {
    active: true,
    id: childNode.id,
    order: childNode.order,
  });
}
