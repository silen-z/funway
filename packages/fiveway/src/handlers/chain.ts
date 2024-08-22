import { type NavigationHandler, type HandlerNext } from "../handler.js";
import type { NodeId } from "../id.js";
import type { NavigationAction } from "../navigation.js";
import { type NavigationNode } from "../node.js";
import type { Metadata, MetadataValue } from "../metadata.js";
import { selectHandler } from "./select.js";
import { defaultHandlerInfo } from "../introspection.js";

export type HandlerChain = NavigationHandler & {
  prepend(another: NavigationHandler): HandlerChain;
  onSelect(fn: () => void): HandlerChain;
  meta<M extends Metadata<any>>(
    meta: M,
    value: MetadataValue<M> | (() => MetadataValue<M>)
  ): HandlerChain;

  // TODO consider other helper handlers
  // in thats case it would be good to consider reusing functions
  // to prevent every chainedHandler from creating many of them
  //
  // onLeft(fn: () => void): HandlerChain;
  // onRight(fn: () => void): HandlerChain;
  // onUp(fn: () => void): HandlerChain;
  // onDown(fn: () => void): HandlerChain;
  // onBack(fn: () => void): HandlerChain;
  // onMove(fn: (d: NavigationDirection) => void): HandlerChain;
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

  const chainedHandler = (
    node: NavigationNode,
    action: NavigationAction,
    next: HandlerNext
  ): NodeId | null => {
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
  chainedHandler.prepend = (prepended: NavigationHandler) => {
    return createChainedHandler({ handler: prepended, next: handler });
  };

  chainedHandler.onSelect = (fn: () => void) => {
    return createChainedHandler({ handler: selectHandler(fn), next: handler });
  };

  chainedHandler.meta = <M extends Metadata<any>>(
    meta: M,
    value: MetadataValue<M> | (() => MetadataValue<M>)
  ) => {
    const fn = typeof value !== "function" ? () => value : value;
    return createChainedHandler({
      handler: meta.providerHandler(fn),
      next: handler,
    });
  };

  return chainedHandler;
}

export { createChainedHandler as chainedHandler };
