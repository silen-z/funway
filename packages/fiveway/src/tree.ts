import { type NodeId, convergingPaths, idsToRoot, isParent } from "./id.js";
import type { CreatedNavigationNode, NavigationNode } from "./node.js";
import { type ListenerTree, callListeners } from "./events.js";
import { type NavigationDirection, runHandler } from "./navigation.js";
import { focusHandler } from "./handlers/focus.js";
import { binarySearch } from "./array.js";

export type NavigationTree = {
  nodes: Map<NodeId, NavigationNode>;
  focusedId: NodeId;
  orphans: Map<NodeId, NodeId[]>;
  listeners: ListenerTree;
};

export function createNavigationTree(): NavigationTree {
  const tree = {
    focusedId: "#",
    nodes: new Map(),
    orphans: new Map(),
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

export function insertNode(tree: NavigationTree, node: CreatedNavigationNode) {
  if (node.parent === null) {
    throw new Error("trying to insert root (or node without parent)");
  }

  if (tree.nodes.has(node.id)) {
    throw new Error(`trying to insert existing node: ${node.id}`);
  }

  node.tree = tree;
  tree.nodes.set(node.id, node as NavigationNode);

  // if its parent is not connected yet so we are done for now
  if (!tree.nodes.has(node.parent)) {
    if (!tree.orphans.has(node.parent)) {
      tree.orphans.set(node.parent, []);
    }

    const orphans = tree.orphans.get(node.parent)!;
    orphans.push(node.id);

    return node;
  }

  connectNode(tree, node.id);

  return node;
}

function connectNode(tree: NavigationTree, id: NodeId) {
  const node = tree.nodes.get(id);
  if (node == null || node.parent == null) {
    throw new Error(`trying to connect invalid node: ${id}`);
  }

  const parentNode = tree.nodes.get(node.parent);
  if (parentNode == null || !parentNode.connected) {
    throw new Error(`trying to connect with invalid parent: ${node.parent}`);
  }

  insertChildInOrder(parentNode, node);
  node.connected = true;

  callListeners(tree, "#", "structurechange");

  if (tree.focusedId === "#" || isFocused(tree, node.parent)) {
    focusNode(tree, node.parent, { direction: "initial" });
  }

  const orphans = tree.orphans.get(node.id);
  if (orphans == null) {
    return;
  }

  for (const orphan of orphans) {
    connectNode(tree, orphan);
  }

  tree.orphans.delete(node.id);
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

  const orphans = tree.orphans.get(node.parent!);
  if (orphans != null) {
    const index = orphans.indexOf(nodeId);
    if (index !== -1) {
      orphans.splice(index, 1);
    }
  }
}

function disconnectNode(tree: NavigationTree, nodeId: NodeId) {
  const node = tree.nodes.get(nodeId);
  if (node == null) {
    return;
  }

  if (node.parent == null) {
    throw new Error("trying to disconnect invalid node");
  }

  // its fine if parent is already diconnected/removed
  const parentNode = tree.nodes.get(node.parent);
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
    if (!tree.orphans.has(node.id)) {
      tree.orphans.set(node.id, []);
    }

    const orphans = tree.orphans.get(node.id)!;
    orphans.push(child.id);

    disconnectNode(tree, child.id);
  }

  node.connected = false;

  if (isFocused(tree, node.id)) {
    tree.focusedId = node.parent;

    idsToRoot(node.parent, (id) => {
      const focused = focusNode(tree, id, { direction: "initial" });

      // if we managed to focus a node we can stop searching
      if (focused) {
        return false;
      }
    });
  }

  callListeners(tree, "#", "structurechange");
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

  const node = tree.nodes.get(nodeId);
  if (node == null || !node.connected) {
    return;
  }

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
