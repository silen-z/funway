import type { NavigationHandler, ChainableHandler } from "../handlers/types.js";

function chain2Handlers(
  handler1: NavigationHandler | ChainableHandler,
  handler2: NavigationHandler | ChainableHandler
): ChainableHandler {
  return makeHandler((node, action, context, next) => {
    const chainedNext = () => handler2(node, action, context, next);

    return handler1(node, action, context, chainedNext);
  });
}

export function makeHandler(
  handler: NavigationHandler | ChainableHandler
): ChainableHandler {
  if ("chain" in handler) {
    return handler;
  }

  const cloned = handler.bind({}) as ChainableHandler;

  cloned.chain = (another) => chain2Handlers(handler, another);

  return cloned;
}

export function chainHandlers(
  handler: NavigationHandler | ChainableHandler,
  ...handlers: (NavigationHandler | ChainableHandler)[]
): ChainableHandler {
  let chainedHandler = makeHandler(handler);

  for (const handler of handlers) {
    chainedHandler = chainedHandler.chain(makeHandler(handler));
  }

  return chainedHandler;
}
