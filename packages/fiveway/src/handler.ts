import type { NodeId } from "./id.js";
import type { NavigationAction } from "./navigation.js";
import type { NavigationNode } from "./node.js";
import { getNode, type NavigationTree } from "./tree.js";

type HandlerNext = {
  (): NodeId | null;
  (id: NodeId, action?: NavigationAction): NodeId | null;
};

/**
 * @category Handler
 */
export type NavigationHandler = (
  node: NavigationNode,
  action: NavigationAction,
  next: HandlerNext
) => NodeId | null;

export type HandlerChain = NavigationHandler & {
  prepend(another: NavigationHandler): HandlerChain;
  append(another: NavigationHandler): HandlerChain;
};

export function runHandler(
  tree: NavigationTree,
  id: NodeId,
  action: NavigationAction
): NodeId | null {
  const next = (id?: NodeId, anotherAction?: NavigationAction) => {
    if (id != null) {
      return runHandler(tree, id, anotherAction ?? action);
    }

    return null;
  };

  const node = getNode(tree, id);
  return node.handler(node, action, next);
}

/**
 * Take handlers and combines them into one so the next handler function
 * automatically passes action to the next handler
 *
 * implementation inspired by:  https://deno.land/x/oak@v16.1.0/middleware.ts?source=#L60
 *
 * @param handlers handlers that will be called in order first to last
 * @returns handler that will pipe navigation actions through via the next function
 */
export function chainHandlers(
  ...handlers: NavigationHandler[]
): HandlerChain {
  const stack = handlers.slice();

  const composedHandler = (
    node: NavigationNode,
    action: NavigationAction,
    next: HandlerNext
  ): NodeId | null => {
    let index = -1;
    function dispatch(i: number): NodeId | null {
      if (i <= index) {
        throw new Error("next() called multiple times.");
      }
      index = i;

      const fn = stack[i];
      if (fn == null) {
        return next();
      }

      return fn(node, action, (id?: NodeId, newAction?: NavigationAction) => {
        if (id != null) {
          return next(id, newAction ?? action);
        }

        return dispatch(i + 1);
      });
    }

    return dispatch(0);
  };

  composedHandler.append = (handler: NavigationHandler) =>
    chainHandlers(...stack, handler);

  composedHandler.prepend = (handler: NavigationHandler) =>
    chainHandlers(handler, ...stack);

  return composedHandler;
}
