import { type NavigationHandler } from "./navigation.js";
import { type NavigationTree } from "./tree.js";

export type NodeId = string;

export interface Provider<T> {
  provide(node: NavigationNode, value: T | null): void;
  provide(node: NavigationNode, fn: () => T | null): void;
  extract: (node: NavigationNode) => T | null;
}

export function createProvider<T>(name?: string): Provider<T> {
  const key = Symbol(name);

  return {
    provide: (node: NavigationNode, value) => {
      node.providers.set(key, value);
    },
    extract: (node: NavigationNode) => {
      const provider = node.providers.get(key);
      if (provider == null) {
        return null;
      }

      return (
        typeof provider === "function" ? provider() : provider
      ) as T | null;
    },
  };
}

type NavigationNodeBase = {
  tree: NavigationTree;
  id: NodeId;
  parent: NodeId | null;
  depth: number;
  order: number;
  focusable: boolean;
  handler: NavigationHandler;
  providers: Map<symbol, unknown | (() => unknown)>;
};

export type NodeChild = { id: NodeId; order: number; active: boolean };

export type NavigationContainer = NavigationNodeBase & {
  type: "container";
  initial: NodeId | null;
  children: NodeChild[];
  captureFocus: boolean;
};

export type NavigationItem = NavigationNodeBase & {
  type: "item";
  onSelect: (() => void) | null;
};

export type NavigationNode = NavigationContainer | NavigationItem;

export function createRoot(
  tree: NavigationTree,
  rootId: NodeId
): NavigationContainer {
  return {
    type: "container",
    tree,
    id: rootId,
    parent: null,
    initial: null,
    order: 0,
    depth: 0,
    focusable: true,
    handler: () => null,
    providers: new Map(),
    children: [],
    captureFocus: true,
  };
}
