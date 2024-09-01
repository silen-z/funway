import { swapRemove } from "./array.js";
import type { NodeId } from "./id.js";
import type { NavigationTree } from "./tree.js";

interface EventMap {
  focuschange: FocusChangeEvent;
  structurechange: StructureChangeEvent;
}

export type FocusChangeEvent = {
  type: "focuschange";
  focused: NodeId;
  previous: NodeId;
};
export type StructureChangeEvent = {
  type: "structurechange";
  operation: "insert" | "removal";
  id: NodeId;
};

export type TreeEvent = StructureChangeEvent | FocusChangeEvent;

export type Listener = {
  type: TreeEvent["type"];
  fn: (event: TreeEvent) => void;
};

export type ListenerTree = Map<NodeId, Listener[]>;

export function registerListener<T extends keyof EventMap>(
  tree: NavigationTree,
  id: NodeId,
  type: T,
  fn: <E extends EventMap[T]>(event: E) => void,
) {
  const listener = { type, fn } as Listener;

  if (!tree.listeners.has(id)) {
    tree.listeners.set(id, []);
  }

  const listeners = tree.listeners.get(id)!;
  listeners.push(listener);

  return () => {
    const listeners = tree.listeners.get(id);
    if (listeners == null) {
      return;
    }

    const index = listeners.findIndex((l) => l === listener);
    if (index === -1) {
      return;
    }

    if (listeners.length === 1) {
      tree.listeners.delete(id);
    } else {
      swapRemove(listeners, index);
    }
  };
}

export function callListeners(
  tree: NavigationTree,
  nodeId: NodeId,
  event: TreeEvent,
) {
  const listeners = tree.listeners.get(nodeId);
  if (listeners == null) {
    return;
  }

  for (const listener of listeners) {
    if (listener.type === event.type) {
      listener.fn(event);
    }
  }
}
