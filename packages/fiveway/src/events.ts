import { swapRemove } from "./array.js";
import type { NodeId } from "./id.js";
import type { NavigationTree } from "./tree.js";

export type Listener = {
  node: NodeId;
  type: "focuschange";
  fn: () => void;
};

export type ListenerTree = Map<NodeId, Listener[]>;

export function registerListener(tree: NavigationTree, listener: Listener) {
  if (!tree.listeners.has(listener.node)) {
    tree.listeners.set(listener.node, []);
  }

  const nodeListeners = tree.listeners.get(listener.node)!;
  nodeListeners.push(listener);

  return () => {
    const index = nodeListeners.findIndex((l) => l === listener);
    if (index === -1) {
      return;
    }

    if (nodeListeners.length === 1) {
      tree.listeners.delete(listener.node);
    } else {
      swapRemove(nodeListeners, index);
    }
  };
}

export function callListeners(
  tree: NavigationTree,
  nodeId: NodeId,
  event: string
) {
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
