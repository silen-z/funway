import type {
  NodeId,
  NavigationNode,
  NavigationContainer,
  NavigationItem,
} from "./node.js";
import { binarySearch, swapRemove } from "./array.js";
import { rootHandler } from "./handlers/default.js";

type FocusListener = () => void;

export type NavigationTree = {
  root: NavigationContainer;
  nodes: Map<NodeId, NavigationNode>;
  focusedId: NodeId;
  focusListeners: FocusListener[];
};

export function createNavigationTree(): NavigationTree {
  const rootId = "#";

  const tree = {
    root: {} as NavigationContainer,
    focusedId: rootId,
    nodes: new Map(),
    focusListeners: [],
  };

  tree.root = {
    type: "container",
    tree,
    id: rootId,
    connected: true,
    parent: null,
    initial: null,
    order: 0,
    depth: 0,
    focusable: true,
    handler: rootHandler,
    providers: new Map(),
    children: [],
    captureFocus: true,
  };
  tree.nodes.set(rootId, tree.root);

  return tree;
}

export function connectNode(tree: NavigationTree, node: NavigationNode) {
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
  node.depth = parentNode.depth + 1;

  if (node.type === "container") {
    for (const n of tree.nodes.values()) {
      if (n.parent === node.id) {
        connectNode(tree, n);
      }
    }
  }

  const focusedNode = getNode(tree, tree.focusedId);
  if (
    focusedNode.type === "container" &&
    isParent(tree, node.id, focusedNode.id)
  ) {
    const n = focusedNode.handler(
      focusedNode,
      { kind: "focus", direction: "initial" },
      { path: [] }
    );
    if (n) {
      focusNode(tree, n);
    }
  }
}

export function removeNode(tree: NavigationTree, nodeId: NodeId) {
  if (nodeId === tree.root.id) {
    throw new Error("cannot remove root node");
  }

  const node = tree.nodes.get(nodeId);
  if (node == null) {
    return;
  }

  if (node.connected) {
    disconnectNode(tree, node.id);
  }

  tree.nodes.delete(node.id);

  if (isFocused(tree, node.id)) {
    let targetNode = null;

    let nextNode = node;
    while (nextNode.parent !== null) {
      nextNode = getContainerNode(tree, nextNode.parent);

      targetNode = nextNode.handler(
        nextNode,
        { kind: "focus", direction: null },
        { path: [] }
      );

      if (targetNode !== null) {
        break;
      }
    }

    focusNode(tree, targetNode ?? tree.root.id, {
      respectCapture: false,
      allowRoot: true,
    });
  }
}

function disconnectNode(tree: NavigationTree, nodeId: NodeId) {
  const node = tree.nodes.get(nodeId);
  if (node == null) {
    return;
  }

  const parentNode = getContainerNode(tree, node.parent!);

  // tombstone id of removed node in parent
  const parentChildRecord = parentNode.children.find(
    (child) => child.id === nodeId
  );
  if (parentChildRecord == null) {
    throw new Error("broken tree");
  }
  parentChildRecord.active = false;

  if (node.type === "container") {
    for (const child of node.children) {
      disconnectNode(tree, child.id);
    }
  }

  node.connected = false;
}

export type FocusOptions = {
  respectCapture?: boolean;
  allowRoot?: boolean;
};

export function focusNode(
  tree: NavigationTree,
  nodeId: NodeId,
  options: FocusOptions = {}
) {
  const node = tree.nodes.get(nodeId);
  if (node == null || !node.connected) {
    return false;
  }

  if (tree.focusedId === nodeId) {
    return true;
  }

  const currentNode = tree.nodes.get(tree.focusedId);
  if (
    nodeId != null &&
    currentNode != null &&
    (options.respectCapture ?? true) &&
    tree.focusedId !== tree.root.id
  ) {
    const lowestCommonAncestor = getLowestCommonAncestor(
      tree,
      nodeId,
      tree.focusedId
    );

    let current = currentNode;
    while (current.id !== lowestCommonAncestor.id) {
      if (current.type === "container" && current.captureFocus) {
        return false;
      }

      current = getContainerNode(tree, current.parent!);
    }
  }

  tree.focusedId = nodeId ?? tree.root.id;
  notifyFocusListeners(tree);

  return true;
}

export function registerFocusListener(
  tree: NavigationTree,
  listener: FocusListener
) {
  tree.focusListeners.push(listener);

  return () => {
    const index = tree.focusListeners.findIndex((l) => l === listener);
    swapRemove(tree.focusListeners, index);
  };
}

function notifyFocusListeners(tree: NavigationTree) {
  for (const listener of tree.focusListeners) {
    listener();
  }
}

export function selectNode(
  tree: NavigationTree,
  nodeId: NodeId,
  focus: boolean = true
) {
  const node = getItemNode(tree, nodeId);

  if (focus) {
    focusNode(tree, node.id);
  }

  node.onSelect?.();
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
): NavigationContainer {
  const node = getNode(tree, nodeId);
  if (node.type !== "container") {
    throw new Error(`node '${nodeId}' is expected to be a container`);
  }

  return node;
}

export function getItemNode(
  tree: NavigationTree,
  nodeId: NodeId
): NavigationItem {
  const node = getNode(tree, nodeId);
  if (node.type !== "item") {
    throw new Error(`node '${nodeId}' is expected to be an item`);
  }

  return node;
}

export function getLeaf(
  tree: NavigationTree,
  nodeId: NodeId
): NavigationNode | null {
  const node = getNode(tree, nodeId);
  if (node.type === "item") {
    return node;
  }

  for (const child of node.children) {
    if (!child.active) {
      continue;
    }

    const leaf = getLeaf(tree, child?.id);

    if (leaf !== null) {
      return leaf;
    }
  }

  return null;
}

export function isFocused(tree: NavigationTree, nodeId: NodeId): boolean {
  if (tree.focusedId === nodeId) {
    return true;
  }

  return isParent(tree, tree.focusedId, nodeId);
}

export function createGlobalId(...tail: NodeId[]) {
  return tail.join("/");
}

export function scopedId(scope: NodeId, nodeId: NodeId) {
  if (nodeId.startsWith("#")) {
    return nodeId;
  }

  return createGlobalId(scope, nodeId);
}

export function traverseNodes(
  tree: NavigationTree,
  nodeId: NodeId,
  fn: (node: NavigationNode) => void
) {
  const node = getNode(tree, nodeId);
  fn(node);

  if (node.type === "container") {
    for (const child of node.children) {
      if (child.active) {
        traverseNodes(tree, child.id, fn);
      }
    }
  }
}

function insertChildInOrder(
  parentNode: NavigationContainer,
  node: NavigationNode
) {
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

// TODO just compare strings here?
export function isParent(
  tree: NavigationTree,
  childId: NodeId,
  parentId: NodeId
) {
  let current: NavigationNode | null = getNode(tree, childId);
  while (current !== null) {
    if (current.id === parentId) {
      return true;
    }
    current = current.parent !== null ? getNode(tree, current.parent) : null;
  }

  return false;
}

function getLowestCommonAncestor(
  tree: NavigationTree,
  idA: NodeId,
  idB: NodeId
) {
  let nodeA = getNode(tree, idA);
  let nodeB = getNode(tree, idB);

  while (nodeA.depth !== nodeB.depth) {
    if (nodeA.depth > nodeB.depth) {
      nodeA = getNode(tree, nodeA.parent!);
    } else {
      nodeB = getNode(tree, nodeB.parent!);
    }
  }

  while (nodeA.id !== nodeB.id) {
    nodeA = getNode(tree, nodeA.parent!);
    nodeB = getNode(tree, nodeB.parent!);
  }

  return nodeA as NavigationContainer;
}
