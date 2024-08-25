import type { NavigationAction, NavigationHandler } from "../navigation.js";
import type { NodeId } from "../id.js";
import { defaultHandlerInfo } from "../introspection.js";

export type ChainedHandler = NavigationHandler & {
  chain: ChainLink | null;
  prepend(another: NavigationHandler | ChainedHandler): ChainedHandler;
};

type ChainLink = {
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
  chain: ChainLink | NavigationHandler | NavigationHandler[] | null = null
): ChainedHandler {
  if (typeof chain === "function") {
    chain = { handler: chain, next: null };
  } else if (Array.isArray(chain)) {
    chain = createChain(chain);
  }

  const chainedHandler: ChainedHandler = (node, action, next) => {
    const runLink = (
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

      return link.handler(node, action, runLink.bind(null, link.next));
    };

    return runLink(chain);
  };

  chainedHandler.chain = chain;

  chainedHandler.prepend = (prepended) => {
    if ("chain" in prepended) {
      if (prepended.chain === null) {
        return chainedHandler;
      }

      const cloned = cloneChain(prepended.chain);
      appendChain(cloned, chain);
      return createChainedHandler(cloned);
    }

    return createChainedHandler({ handler: prepended, next: chain });
  };

  return chainedHandler;
}

function createChain(
  handlers: (NavigationHandler | ChainedHandler)[]
): ChainLink | null {
  if (handlers.length === 0) {
    return null;
  }

  let chain = null;
  for (let i = handlers.length - 1; i >= 0; i--) {
    chain = { handler: handlers[i]!, next: chain };
  }

  return chain;
}

function appendChain(chain: ChainLink, next: ChainLink | null) {
  let current = chain;
  while (current.next !== null) {
    current = current.next;
  }

  current.next = next;
}

function cloneChain(original: ChainLink) {
  const cloned: ChainLink = { handler: original.handler, next: null };

  let current = original;
  let currentCloned = cloned;

  while (current.next !== null) {
    currentCloned.next = { handler: current.next.handler, next: null };

    current = current.next;
    currentCloned = currentCloned.next;
  }

  return cloned;
}

export { createChainedHandler as chainedHandler };
