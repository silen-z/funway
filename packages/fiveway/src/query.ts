import { type NavigationHandler, runHandler } from "./handler.js";
import type { NodeId } from "./id.js";
import type { NavigationAction } from "./navigation.js";
import type { NavigationTree } from "./tree.js";

export function queryable<T extends object>(key: string) {
  return {
    handler:
      (value: (() => T | null) | T): NavigationHandler =>
      (_, action, next) => {
        if (action.kind === "query" && action.key === key) {
          action.value = typeof value === "function" ? value() : value;
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
