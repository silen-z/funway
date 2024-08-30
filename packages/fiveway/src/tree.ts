import { type NodeId, convergingPaths, idsToRoot, isParent } from "./id.js";
import type { CreatedNavigationNode, NavigationNode } from "./node.js";
import { type ListenerTree, type TreeEvent, callListeners } from "./events.js";
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

  const parentNode = tree.nodes.get(node.parent);
  if (parentNode != null && parentNode.connected) {
    connectNode(tree, parentNode, node as NavigationNode);
  } else {
    markOrphan(tree, node.parent, node.id);
  }

  return node;
}

function connectNode(
  tree: NavigationTree,
  parentNode: NavigationNode,
  node: NavigationNode
) {
  insertChildInOrder(parentNode, node);
  node.connected = true;

  const event: TreeEvent = {
    type: "structurechange",
    operation: "insert",
    id: node.id,
  };
  idsToRoot(node.id, (id) => {
    callListeners(tree, id, event);
  });

  if (tree.focusedId === "#" || isFocused(tree, parentNode.id)) {
    focusNode(tree, parentNode.id, { direction: "initial" });
  }

  const orphans = tree.orphans.get(node.id);
  if (orphans == null) {
    return;
  }

  for (const orphanId of orphans) {
    connectNode(tree, node, tree.nodes.get(orphanId)!);
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
  clearOrphan(tree, node.parent!, nodeId);
}

function disconnectNode(tree: NavigationTree, nodeId: NodeId) {
  const node = tree.nodes.get(nodeId);
  if (node == null) {
    return;
  }

  if (node.parent == null) {
    throw new Error("trying to disconnect invalid node");
  }

  // disconnect children first
  for (const child of node.children) {
    if (!child.active) {
      continue;
    }

    disconnectNode(tree, child.id);
    markOrphan(tree, node.id, child.id);
  }

  // its fine if parent is already disconnected/removed
  const parentNode = tree.nodes.get(node.parent);
  if (parentNode != null) {
    removeChildFromParent(parentNode, node);
  }

  node.connected = false;

  const event: TreeEvent = {
    type: "structurechange",
    operation: "removal",
    id: node.id,
  };
  idsToRoot(node.parent, (id) => {
    callListeners(tree, id, event);
  });

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

  if (resolvedId === null) {
    return false;
  }

  if (tree.focusedId === resolvedId) {
    return true;
  }

  const lastFocused = tree.focusedId;
  tree.focusedId = resolvedId;

  const event: TreeEvent = {
    type: "focuschange",
    focused: tree.focusedId,
    previous: lastFocused,
  };

  convergingPaths(lastFocused, tree.focusedId, (id) => {
    callListeners(tree, id, event);
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

    // otherwise remove the tombstone so it can be inserted again at correct index
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

function removeChildFromParent(
  parentNode: NavigationNode,
  childNode: NavigationNode
) {
  // tombstone id of removed node in parent
  const parentChildIndex = parentNode.children.findIndex(
    (child) => child.id === childNode.id
  );
  if (parentChildIndex === -1) {
    console.error("encountered broken tree");
  }

  // remember the position if its not explicitly set
  if (childNode.order === null) {
    parentNode.children[parentChildIndex]!.active = false;
  } else {
    parentNode.children.splice(parentChildIndex, 1);
  }
}

function markOrphan(tree: NavigationTree, parent: NodeId, child: NodeId) {
  if (!tree.orphans.has(parent)) {
    tree.orphans.set(parent, []);
  }

  const orphans = tree.orphans.get(parent)!;
  orphans.push(child);
}

function clearOrphan(tree: NavigationTree, parent: NodeId, child: NodeId) {
  const orphans = tree.orphans.get(parent);
  if (orphans != null) {
    const index = orphans.indexOf(child);
    if (index !== -1) {
      orphans.splice(index, 1);
    }
  }
}
