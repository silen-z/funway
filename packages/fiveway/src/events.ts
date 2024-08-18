import { swapRemove } from "./array.js";
import type { NodeId } from "./id.js";
import type { NavigationTree } from "./tree.js";

export type Listener = {
  node: NodeId;
  type: "focuschange" | "structurechange";
  fn: () => void;
};

export type ListenerTree = Map<NodeId, Listener[]>;

export function registerListener(tree: NavigationTree, listener: Listener) {
  if (!tree.listeners.has(listener.node)) {
    tree.listeners.set(listener.node, []);
  }

  const listeners = tree.listeners.get(listener.node)!;
  listeners.push(listener);

  return () => {
    const listeners = tree.listeners.get(listener.node);
    if (listeners == null) {
      return;
    }

    const index = listeners.findIndex((l) => l === listener);
    if (index === -1) {
      return;
    }

    if (listeners.length === 1) {
      tree.listeners.delete(listener.node);
    } else {
      swapRemove(listeners, index);
    }
  };
}

export function callListeners(
  tree: NavigationTree,
  nodeId: NodeId,
  event: string
) {
  const listeners = tree.listeners.get(nodeId);
  if (listeners == null) {
    return;
  }

  for (const listener of listeners) {
    if (listener.type === event) {
      listener.fn();
    }
  }
}
