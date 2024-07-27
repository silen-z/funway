import type { NavigationAction } from "./navigation.js";
import type { NodeId, NavigationNode } from "./node.js";
import { getNode, type NavigationTree } from "./tree.js";

// TODO consider getting rid of context and read focusedNode directly from tree
export type NavigationHandlerContext = {
  path: NodeId[];
};

type HandlerNext = {
  (): NodeId | null;
  (id: NodeId, action?: NavigationAction): NodeId | null;
};

export type NavigationHandler = (
  node: NavigationNode,
  action: NavigationAction,
  next: HandlerNext,
  context: NavigationHandlerContext
) => NodeId | null;

export type ChainableHandler = NavigationHandler & {
  prepend(another: NavigationHandler | ChainableHandler): ChainableHandler;
  append(another: NavigationHandler | ChainableHandler): ChainableHandler;
};

export function makeHandler(
  handler: NavigationHandler | ChainableHandler
): ChainableHandler {
  if ("append" in handler) {
    return handler;
  }

  const cloned = handler.bind({}) as ChainableHandler;

  cloned.prepend = (another) => chain2Handlers(another, handler);
  cloned.append = (another) => chain2Handlers(handler, another);

  return cloned;
}

export function runHandler(
  tree: NavigationTree,
  id: NodeId,
  action: NavigationAction,
  context: NavigationHandlerContext = { path: [] }
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

export function chainHandlers(
  handler: NavigationHandler | ChainableHandler,
  ...handlers: (NavigationHandler | ChainableHandler)[]
): ChainableHandler {
  let chainedHandler = makeHandler(handler);

  for (const handler of handlers) {
    chainedHandler = chainedHandler.append(makeHandler(handler));
  }

  return chainedHandler;
}

function chain2Handlers(
  handler1: NavigationHandler | ChainableHandler,
  handler2: NavigationHandler | ChainableHandler
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
