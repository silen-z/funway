import { type NavigationHandler, runHandler } from "./handler.js";
import type { NodeId } from "./id.js";
import type { NavigationAction } from "./navigation.js";
import type { NavigationTree } from "./tree.js";

export type Queryable<T> = {
  handler: (v: () => T | null) => NavigationHandler;
  query: (tree: NavigationTree, id: NodeId) => T | null;
};

export function queryable<T>(key: string): Queryable<T> {
  return {
    handler: (value) => (_, action, next) => {
      if (action.kind === "query" && action.key === key) {
        action.value = value();
        return null;
      }

      return next();
    },
    query: (tree: NavigationTree, id: NodeId) => {
      let query: NavigationAction = { kind: "query", key, value: null };
      runHandler(tree, id, query);
      return query.value as T | null;
    },
  };
}
