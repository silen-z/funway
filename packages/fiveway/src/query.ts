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
    handler: (value) => {
      const queryHandler: NavigationHandler = (_, action, next) => {
        if (action.kind === "query" && action.key === key) {
          action.value = value();
          return null;
        }

        return next();
      };

      return queryHandler;
    },
    query: (tree: NavigationTree, id: NodeId) => {
      let query: NavigationAction = { kind: "query", key, value: null };
      runHandler(tree, id, query);
      return query.value as T | null;
    },
  };
}

export type QueryableValue<Q extends Queryable<any>> = Q extends Queryable<
  infer V
>
  ? V | null
  : never;
