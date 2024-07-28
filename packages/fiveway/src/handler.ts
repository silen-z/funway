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

export type ChainableHandler = NavigationHandler & {
  prepend(another: NavigationHandler): ChainableHandler;
  append(another: NavigationHandler): ChainableHandler;
};

export function makeHandler(handler: NavigationHandler): ChainableHandler {
  const chainable = handler.bind({}) as ChainableHandler;

  chainable.prepend = (another) => chain2Handlers(another, handler);
  chainable.append = (another) => chain2Handlers(handler, another);

  return chainable;
}

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

 * @param handlers handlers that will be called in order first to last 
 * @returns handler that will pipe navigation actions through via the next function
 */
export function chainHandlers(
  ...handlers: NavigationHandler[]
): ChainableHandler {
  return wrapHandler(
    handlers.reduce((chained, another) => chain2Handlers(chained, another))
  );
}

// TODO check if this technique can be used: https://deno.land/x/oak@v16.1.0/middleware.ts?source=#L60
function chain2Handlers(
  handler1: NavigationHandler,
  handler2: NavigationHandler
): ChainableHandler {
  return makeHandler((node, action, next) => {
    const chainedNext = (id?: NodeId, newAction?: NavigationAction) => {
      if (id != null) {
        return runHandler(node.tree, id, newAction ?? action);
      }

      return handler2(node, action, next);
    };

    return handler1(node, action, chainedNext);
  });
}

function wrapHandler(
  handler: NavigationHandler | ChainableHandler
): ChainableHandler {
  if ("append" in handler) {
    return handler;
  }

  return makeHandler(handler);
}
