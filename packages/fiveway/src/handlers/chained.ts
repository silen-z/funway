import type { NavigationAction, NavigationHandler } from "../navigation.js";
import type { NodeId } from "../id.js";
import { defaultHandlerInfo } from "../introspection.js";

export type HandlerChain = NavigationHandler & {
  prepend(another: NavigationHandler): HandlerChain;
};

type ChainLink = {
  accept?: Set<string>;
  handler: NavigationHandler;
  next: ChainLink | null;
};

/**
 * Take handlers and combines them into one so the next handler function
 * automatically passes action to the next handler
 *
 * @param handlers handlers that will be called in order first to last
 * @returns handler that will pipe navigation actions through via the next function
 */
function createChainedHandler(
  handler: ChainLink | NavigationHandler | null = null
) {
  if (typeof handler === "function") {
    handler = { handler, next: null };
  }

  const chainedHandler: HandlerChain = (node, action, next) => {
    const linkHandler = (
      link: ChainLink | null,
      id?: NodeId,
      newAction?: NavigationAction
    ): NodeId | null => {
      if (id != null) {
        return next(id, newAction ?? action);
      }

      if (link == null) {
        return next();
      }

      if (import.meta.env.DEV) {
        defaultHandlerInfo(link.handler, node, action);
      }

      return link.handler(node, action, linkHandler.bind(null, link.next));
    };

    return linkHandler(handler);
  };

  // TODO connecting chains
  chainedHandler.prepend = (prepended) => {
    return createChainedHandler({ handler: prepended, next: handler });
  };

  return chainedHandler;
}

export { createChainedHandler as chainedHandler };
