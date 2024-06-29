import {
  type NavigationHandler,
  itemHandler,
  parentHandler,
} from "./navigation.js";
import {
  type NodeId,
  type NavigationNode,
  type NavigationContainer,
  type NavigationItem,
  createRoot,
} from "./node.js";
import { binarySearch, swapRemove } from "./array.js";

type FocusListener = () => void;

export type NavigationTree = {
  root: NavigationContainer;
  nodes: Map<NodeId, NavigationNode>;
  disconnectedNodes: Map<NodeId, NavigationNode>;
  focusedId: NodeId;
  focusListeners: FocusListener[];
};

export function createNavigationTree(): NavigationTree {
  const rootId = "#";

  const tree = {
    root: {} as NavigationContainer,
    focusedId: rootId,
    nodes: new Map(),
    disconnectedNodes: new Map(),
    focusListeners: [],
  };

  tree.root = createRoot(tree, rootId);
  tree.nodes.set(rootId, tree.root);

  return tree;
}

export type NodeConfig = {
  id: string;
  parent: NodeId;
  focusable?: boolean;
  order?: number;
  handler?: NavigationHandler;
};

export type ItemNodeConfig = NodeConfig & {
  onSelect?: () => void;
};

export function createItemNode(
  tree: NavigationTree,
  options: ItemNodeConfig
): NavigationItem {
  const globalId = createGlobalId(options.parent, options.id);

  return {
    type: "item",
    tree,
    id: globalId,
    parent: options.parent,
    order: options.order ?? 0,
    depth: 0,
    focusable: options.focusable ?? true,
    handler: options.handler ?? itemHandler,
    providers: new Map(),
    onSelect: options.onSelect ?? null,
  };
}

export type ContainerNodeConfig = NodeConfig & {
  initial?: NodeId;
  captureFocus?: boolean;
};

export function createContainerNode(
  tree: NavigationTree,
  options: ContainerNodeConfig
): NavigationContainer {
  const globalId = createGlobalId(options.parent, options.id);

  return {
    type: "container",
    tree,
    id: globalId,
    parent: options.parent,
    initial: options.initial ? scopedId(globalId, options.initial) : null,
    order: options.order ?? 0,
    depth: 0,
    focusable: options.focusable ?? true,
    handler: options.handler ?? parentHandler,
    providers: new Map(),
    children: [],
    captureFocus: options.captureFocus ?? false,
  };
}

export function connectNode(tree: NavigationTree, node: NavigationNode) {
  if (!tree.nodes.has(node.parent!)) {
    tree.disconnectedNodes.set(node.id, node);
    return;
  }

  const existingNode = tree.nodes.get(node.id);
  if (existingNode != null) {
    console.warn(`trying to connect existing node: ${node.id}`);
  }

  const parentNode = getContainerNode(tree, node.parent!);

  tree.disconnectedNodes.delete(node.id);
  tree.nodes.set(node.id, node);
  // TODO this functionality probably depends on disconnectedNodes Map being ordered
  // it would be better to handle that explicitly
  insertChildInOrder(parentNode, node);
  node.depth = parentNode.depth + 1;

  if (node.type === "container") {
    for (const n of tree.disconnectedNodes.values()) {
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
    focusedNode;

    const nodeToFocus = findInitialFocus(tree, focusedNode.id);
    if (nodeToFocus != null) {
      focusNode(tree, nodeToFocus);
    }
  }
}

function findInitialFocus(tree: NavigationTree, nodeId: NodeId): NodeId | null {
  const node = getNode(tree, nodeId);

  if (node.type === "item") {
    return node.id;
  }

  const child = node.children.find(
    (c) => c.active && (node.initial === null || c.id === node.initial)
  );

  if (child != null) {
    return findInitialFocus(tree, child.id);
  }

  return null;
}

export function updateNode(
  node: NavigationItem,
  config: Omit<ItemNodeConfig, "id" | "parent">
): void;
export function updateNode(
  node: NavigationContainer,
  config: Omit<ContainerNodeConfig, "id" | "parent">
): void;
export function updateNode<N extends NavigationNode>(
  node: N,
  options: Omit<ItemNodeConfig & ContainerNodeConfig, "id" | "parent">
) {
  if (options.handler != null) {
    node.handler = options.handler;
  }

  if (options.focusable != null) {
    node.focusable = options.focusable;
  }

  if (options.order != null) {
    updateNodeOrder(node.tree, node.id, options.order);
  }

  if (node.type === "item" && options.onSelect != null) {
    node.onSelect = options.onSelect;
  }

  if (node.type === "container" && options.captureFocus != null) {
    node.captureFocus = options.captureFocus;
  }
}

export function updateNodeOrder(
  tree: NavigationTree,
  globalId: NodeId,
  newOrder: number
) {
  const node = getNode(tree, globalId);

  if (node.order !== newOrder && node.parent !== null) {
    node.order = newOrder;

    // update children inside parent
    const parentNode = getContainerNode(tree, node.parent);

    const childIndex = parentNode.children.findIndex((i) => i.id === node.id);
    const newIndex = binarySearch(
      parentNode.children,
      (child) => newOrder < child.order
    );

    if (newIndex === -1 || newIndex === childIndex) {
      return;
    }

    parentNode.children[childIndex!]!.order = newOrder;
    const removed = parentNode.children.splice(childIndex, 1);
    parentNode.children.splice(newIndex, 0, ...removed);
  }
}

export function removeNode(tree: NavigationTree, nodeId: NodeId) {
  if (nodeId === tree.root.id) {
    throw new Error("cannot remove root node");
  }

  const node = tree.nodes.get(nodeId);

  // node is probably already disconnected
  if (node == null) {
    tree.disconnectedNodes.delete(nodeId);
    return;
  }

  const updateFocus = tree.focusedId === nodeId || hasFocusWithin(tree, nodeId);

  disconnectNode(tree, nodeId);
  tree.disconnectedNodes.delete(nodeId);

  if (updateFocus) {
    let targetNode = null;
    let nextNode = node;
    while (nextNode.parent !== null) {
      nextNode = getContainerNode(tree, nextNode.parent);

      targetNode = nextNode.handler(
        nextNode,
        { kind: "focus", from: null },
        { path: [] }
      );

      if (targetNode !== null) {
        break;
      }
    }

    if (targetNode != null) {
      focusNode(tree, targetNode, { respectCapture: false });
    } else {
      tree.focusedId = tree.root.id;
      notifyFocusListeners(tree);
    }
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

  tree.nodes.delete(nodeId);
  tree.disconnectedNodes.set(nodeId, node);
}

export type FocusOptions = {
  respectCapture?: boolean;
};

export function focusNode(
  tree: NavigationTree,
  nodeId: NodeId,
  options: FocusOptions = {}
) {
  const node = getNode(tree, nodeId);

  const nodeToFocus = node.handler(
    node,
    { kind: "focus", from: null },
    { path: [] }
  );

  if (nodeToFocus == null) {
    throw new Error(`cannot focus node '${nodeId}'`);
  }

  if (tree.focusedId === nodeToFocus) {
    return;
  }

  const currentNode = tree.nodes.get(tree.focusedId);
  if (
    currentNode != null &&
    (options.respectCapture ?? true) &&
    tree.focusedId !== "#"
  ) {
    const lowestCommonAncestor = getLowestCommonAncestor(
      tree,
      nodeToFocus,
      tree.focusedId
    );

    let current = currentNode;
    while (current.id !== lowestCommonAncestor.id) {
      if (current.type === "container" && current.captureFocus) {
        return;
      }

      current = getContainerNode(tree, current.parent!);
    }
  }

  tree.focusedId = nodeToFocus;
  notifyFocusListeners(tree);
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

export function hasFocusWithin(tree: NavigationTree, nodeId: NodeId): boolean {
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

  let index = parentNode.children.length - 1;
  while (index >= 0) {
    if (parentNode.children[index]!.order <= node.order) {
      break;
    }
    index -= 1;
  }

  parentNode.children.splice(index + 1, 0, {
    active: true,
    id: node.id,
    order: node.order,
  });
}

// function getDepth(tree: NavigationTree, nodeId: NodeId) {
//   let depth = 0;
//   let node = getNode(tree, nodeId);

//   while (node.parent !== null) {
//     depth += 1;
//     node = getNode(tree, node.parent);
//   }

//   return depth;
// }

// TODO just compare strings here?
function isParent(tree: NavigationTree, childId: NodeId, parentId: NodeId) {
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
