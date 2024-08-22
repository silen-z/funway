import { type NavigationHandler, runHandler } from "./handler.js";
import type { NodeId } from "./id.js";
import { describeHandler } from "./introspection.js";
import type { NavigationAction } from "./navigation.js";
import type { NavigationTree } from "./tree.js";

export type Metadata<T> = {
  key: string;
  providerHandler: (v: () => T | null) => NavigationHandler;
  query: (tree: NavigationTree, id: NodeId) => T | null;
};

export function defineMetadata<T>(key: string): Metadata<T> {
  return {
    key,
    providerHandler: (value) => {
      const metadataProvider: NavigationHandler = (_, action, next) => {
        if (import.meta.env.DEV) {
          describeHandler(action, { name: "core:metadata-provider", key });
        }

        if (action.kind === "query" && action.key === key) {
          action.value = value();
          return null;
        }

        return next();
      };

      return metadataProvider;
    },
    query: (tree: NavigationTree, id: NodeId) => {
      let query: NavigationAction = { kind: "query", key, value: null };
      runHandler(tree, id, query);
      return query.value as T | null;
    },
  };
}

export type MetadataValue<Q extends Metadata<any>> = Q extends Metadata<infer V>
  ? V | null
  : never;
