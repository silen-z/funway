import {
  type NavigationHandler,
  type NavigationAction,
  runHandler,
} from "./navigation.js";
import type { NodeId } from "./id.js";
import { describeHandler } from "./introspection.js";
import type { NavigationTree } from "./tree.js";

type MetaValue = object | string | number | undefined | null;

type MetadataProvider<T> = T | (() => T | null) | null;

export type Metadata<T extends MetaValue = MetaValue> = {
  key: string;
  providerHandler: (v: MetadataProvider<T>) => NavigationHandler;
  query: (tree: NavigationTree, id: NodeId) => T | null;
};

export function defineMetadata<T extends MetaValue>(key: string): Metadata<T> {
  return {
    key,
    providerHandler: (value) => {
      const metadataProvider: NavigationHandler = (_, action, next) => {
        if (import.meta.env.DEV) {
          describeHandler(action, { name: "core:metadata-provider", key });
        }

        if (action.kind === "query" && action.key === key) {
          action.value = typeof value === "function" ? value() : value;
          return null;
        }

        return next();
      };

      return metadataProvider;
    },
    query: (tree: NavigationTree, id: NodeId) => {
      const query: NavigationAction = { kind: "query", key, value: null };
      runHandler(tree, id, query);
      return query.value as T | null;
    },
  };
}
