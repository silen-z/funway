import type { NavigationAction } from "./navigation.js";
import type { NodeId, NavigationNode } from "./node.js";
import { getNode, type NavigationTree } from "./tree.js";

type HandlerNext = {
  (): NodeId | null;
  (id: NodeId, action?: NavigationAction): NodeId | null;
}

// TODO consider getting rid of context and read focusedNode directly from tree
type HandlerContext = {
  path: NodeId[];
};

/**
 * @category Handler
 */
export type NavigationHandler = (
  node: NavigationNode,
  action: NavigationAction,
  next: HandlerNext,
  context: HandlerContext
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
  action: NavigationAction,
  context: HandlerContext = { path: [] }
): NodeId | null {
  const next = (id?: NodeId, anotherAction?: NavigationAction) => {
    if (id != null) {
      return runHandler(tree, id, anotherAction ?? action, context);
    }

    return null;
  };

  const node = getNode(tree, id);
  return node.handler(node, action, next, context);
}

/**
 * Take handlers and combines them into one so the next handler function
 * automatically passes action to the next handler

 * @param handler handler that will be called first
 * @param handlers handlers that will be called in order first to last 
 * @returns single handler that will pipe navigation action through all given handlers
 */
export function chainHandlers(
  handler: NavigationHandler,
  ...handlers: NavigationHandler[]
): ChainableHandler {
  let chainedHandler = wrapHandler(handler);

  for (const handler of handlers) {
    chainedHandler = chainedHandler.append(wrapHandler(handler));
  }

  return chainedHandler;
}

function wrapHandler(
  handler: NavigationHandler | ChainableHandler
): ChainableHandler {
  if ("append" in handler) {
    return handler;
  }

  return makeHandler(handler);
}

// TODO check if this technique can be used: https://deno.land/x/oak@v16.1.0/middleware.ts?source=#L60
function chain2Handlers(
  handler1: NavigationHandler,
  handler2: NavigationHandler
): ChainableHandler {
  return makeHandler((node, action, next, context) => {
    const chainedNext = (id?: NodeId, anotherAction?: NavigationAction) => {
      if (id != null) {
        return runHandler(node.tree, id, anotherAction ?? action, context);
      }

      return handler2(node, action, next, context);
    };

    return handler1(node, action, chainedNext, context);
  });
}
