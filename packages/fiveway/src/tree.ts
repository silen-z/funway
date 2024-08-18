import {
  type NodeId,
  convergingPaths,
  idsToRoot,
  isParent,
  ROOT,
} from "./id.js";
import type { NavigationNode, ContainerNode, ItemNode } from "./node.js";
import { type ListenerTree, callListeners } from "./events.js";
import { runHandler } from "./handler.js";
import { rootHandler } from "./handlers/default.js";
import { binarySearch, swapRemove } from "./array.js";
import type { NavigationDirection } from "./navigation.js";

export type NavigationTree = {
  nodes: Map<NodeId, NavigationNode>;
  focusedId: NodeId;
  listeners: ListenerTree;
};

export function createNavigationTree(): NavigationTree {
  let tree = {
    focusedId: ROOT,
    nodes: new Map(),
    listeners: new Map(),
  };

  tree.nodes.set(ROOT, {
    type: "container",
    tree,
    id: ROOT,
    connected: true,
    parent: null,
    order: 0,
    handler: rootHandler,
    children: [],
    rememberChildren: true,
  });

  return tree;
}

export function connectNode(
  tree: NavigationTree,
  node: NavigationNode,
  notify = true
) {
  if (node.parent === null) {
    throw new Error("trying to connect root (or node without parent)");
  }

  if (!tree.nodes.has(node.parent)) {
    tree.nodes.set(node.id, node);
    return;
  }

  const existingNode = tree.nodes.get(node.id);
  if (existingNode != null && existingNode.connected) {
    console.warn(`trying to connect existing node: ${node.id}`);
  }

  tree.nodes.set(node.id, node);
  node.connected = true;

  // TODO preserving order probably depends on nodes Map being ordered
  // it would be better to handle that explicitly via sentinel nodes (children)
  const parentNode = getContainerNode(tree, node.parent);
  insertChildInOrder(parentNode, node);

  if (node.type === "container") {
    // TODO optimise iteration through all nodes
    for (const n of tree.nodes.values()) {
      if (n.parent === node.id) {
        connectNode(tree, n, false);
      }
    }
  }

  if (notify) {
    callListeners(tree, ROOT, "structurechange");
  }

  if (isParent(tree.focusedId, node.id)) {
    focusNode(tree, tree.focusedId, { direction: "initial" });
  }
}

export function removeNode(tree: NavigationTree, nodeId: NodeId) {
  if (nodeId === ROOT) {
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
  callListeners(tree, ROOT, "structurechange");

  if (isFocused(tree, nodeId)) {
    idsToRoot(node.parent!, (id) => {
      // skip the removed id
      if (id === nodeId) {
        return true;
      }

      if (focusNode(tree, id, { direction: "initial" })) {
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

  const parentNode = getContainerNode(tree, node.parent!);

  if (parentNode.rememberChildren) {
    // tombstone id of removed node in parent
    const parentChildRecord = parentNode.children.find(
      (child) => child.id === nodeId
    );
    if (parentChildRecord == null) {
      throw new Error("broken tree");
    }
    parentChildRecord.active = false;
  } else {
    const parentChildIndex = parentNode.children.findIndex(
      (child) => child.id === nodeId
    );

    if (parentChildIndex === -1) {
      throw new Error("broken tree");
    }
    swapRemove(parentNode.children, parentChildIndex);
  }

  if (node.type === "container") {
    for (const child of node.children) {
      disconnectNode(tree, child.id);
    }
  }

  node.connected = false;
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

export function getContainerNode(
  tree: NavigationTree,
  nodeId: NodeId
): ContainerNode {
  const node = getNode(tree, nodeId);
  if (node.type !== "container") {
    throw new Error(`node '${nodeId}' is expected to be a container`);
  }

  return node;
}

export function getItemNode(tree: NavigationTree, nodeId: NodeId): ItemNode {
  const node = getNode(tree, nodeId);
  if (node.type !== "item") {
    throw new Error(`node '${nodeId}' is expected to be an item`);
  }

  return node;
}

export function isFocused(tree: NavigationTree, nodeId: NodeId): boolean {
  if (tree.focusedId === nodeId) {
    return true;
  }

  return isParent(nodeId, tree.focusedId);
}

// TODO better implementation for depth
export function traverseNodes(
  tree: NavigationTree,
  nodeId: NodeId,
  fn: (node: NavigationNode) => void,
  depth = 1
) {
  const node = getNode(tree, nodeId);
  fn(node);

  if (depth === 0) {
    return;
  }

  if (node.type === "container") {
    for (const child of node.children) {
      if (child.active) {
        traverseNodes(tree, child.id, fn, depth - 1);
      }
    }
  }
}

function insertChildInOrder(parentNode: ContainerNode, node: NavigationNode) {
  const tombstone = parentNode.children.find((child) => child.id === node.id);
  if (tombstone != null) {
    // TODO: handle if node has explicit order
    tombstone.active = true;
    return;
  }

  const newIndex = binarySearch(
    parentNode.children,
    // TODO handle null in order better?
    (child) => (node.order ?? 0) < (child.order ?? 0)
  );

  parentNode.children.splice(newIndex, 0, {
    active: true,
    id: node.id,
    order: node.order,
  });
}
