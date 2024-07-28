import type { NavigationNode } from "./node.js";

export type Provider<T> = {
  provide(node: NavigationNode, value: T | null): void;
  provide(node: NavigationNode, fn: () => T | null): void;
  extract: (node: NavigationNode) => T | null;
};

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
