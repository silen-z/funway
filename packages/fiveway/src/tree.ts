import type {
  NodeId,
  NavigationNode,
  NavigationContainer,
  NavigationItem,
} from "./node.js";
import { binarySearch } from "./array.js";
import { rootHandler } from "./handlers/default.js";
import { runHandler } from "./handlers.js";
import { splitRemainders } from "./string.js";

type Listener = {
  node: NodeId;
  type: "focuschange";
  fn: () => void;
};

export type NavigationTree = {
  root: NavigationContainer;
  nodes: Map<NodeId, NavigationNode>;
  focusedId: NodeId;
  listeners: Map<NodeId, Set<Listener>>;
};

export function createNavigationTree(): NavigationTree {
  const rootId = "#";

  const tree = {
    root: {} as NavigationContainer,
    focusedId: rootId,
    nodes: new Map(),
    listeners: new Map(),
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
  if (focusedNode.type === "container" && isParent(focusedNode.id, node.id)) {
    const nodeToFocus = runHandler(focusedNode, {
      kind: "focus",
      direction: "initial",
    });
    if (nodeToFocus) {
      focusNode(tree, nodeToFocus);
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

    splitRemainders(node.parent!, "/", (id) => {
      targetNode = runHandler(tree.nodes.get(id)!, {
        kind: "focus",
        direction: null,
      });
      if (targetNode !== null) {
        return false;
      }
    });

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
  targetId: NodeId,
  options: FocusOptions = {}
) {
  const node = tree.nodes.get(targetId);
  if (node == null || !node.connected) {
    return false;
  }

  if (tree.focusedId === targetId) {
    return true;
  }

  if (options.respectCapture ?? true) {
    let allowFocus = true;

    splitRemainders(tree.focusedId, "/", (id) => {
      if (targetId.startsWith(id)) {
        return false;
      }

      const parentNode = tree.nodes.get(id);
      if (
        parentNode != null &&
        parentNode.type === "container" &&
        parentNode.captureFocus
      ) {
        allowFocus = false;
        return false;
      }
    });

    if (!allowFocus) {
      return false;
    }
  }

  const lastFocused = tree.focusedId;
  tree.focusedId = targetId;

  convergingPaths(lastFocused, tree.focusedId, (id) => {
    callListeners(tree, id, "focuschange");
  });

  return true;
}

export function registerFocusListener(
  tree: NavigationTree,
  listener: Listener
) {
  if (!tree.listeners.has(listener.node)) {
    tree.listeners.set(listener.node, new Set());
  }

  const nodeListeners = tree.listeners.get(listener.node)!;

  nodeListeners.add(listener);

  return () => {
    nodeListeners.delete(listener);
    if (nodeListeners.size === 0) {
      tree.listeners.delete(listener.node);
    }
  };
}

function convergingPaths(
  node1: NodeId,
  node2: NodeId,
  cb: (id: NodeId) => void
) {
  if (node1 !== node2) {
    splitRemainders(node2, "/", (id) => {
      if (node1.startsWith(id)) {
        return false;
      }

      cb(id);
    });
  }

  splitRemainders(node1, "/", cb);
}

function callListeners(tree: NavigationTree, nodeId: NodeId, event: string) {
  const listenerNode = tree.listeners.get(nodeId);
  if (listenerNode == null) {
    return;
  }

  for (const listener of listenerNode) {
    if (listener.type === event) {
      listener.fn();
    }
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

  return isParent(nodeId, tree.focusedId);
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

export function isParent(parentId: NodeId, childId: NodeId) {
  return childId.startsWith(parentId + "/");
}
