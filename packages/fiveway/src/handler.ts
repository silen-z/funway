import type { NodeId } from "./id.js";
import type { NavigationAction } from "./navigation.js";
import type { NavigationNode } from "./node.js";
import { getNode, type NavigationTree } from "./tree.js";
import { selectHandler } from "./handlers/default.js";

export type HandlerNext = {
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

export type HandlerChain = NavigationHandler & {
  prepend(another: NavigationHandler): HandlerChain;
  onSelect(fn: () => void): HandlerChain;
  // TODO consider other helper handlers
  // onLeft(fn: () => void): HandlerChain;
  // onRight(fn: () => void): HandlerChain;
  // onUp(fn: () => void): HandlerChain;
  // onDown(fn: () => void): HandlerChain;
  // onBack(fn: () => void): HandlerChain;
  // onMove(fn: (d: NavigationDirection) => void): HandlerChain;
};

/**
 * Take handlers and combines them into one so the next handler function
 * automatically passes action to the next handler
 *
 * @param handlers handlers that will be called in order first to last
 * @returns handler that will pipe navigation actions through via the next function
 */
export function chainHandlers(...handlers: NavigationHandler[]): HandlerChain {
  const chain = chainFromArray(handlers);
  return chainedHandler(chain);
}

function chainedHandler(chain: ChainLink | null) {
  const chained = (
    node: NavigationNode,
    action: NavigationAction,
    next: HandlerNext
  ): NodeId | null => {
    const dispatch = (
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

      return link.handler(node, action, dispatch.bind(null, link.next));
    };

    return dispatch(chain);
  };

  chained.prepend = (handler: NavigationHandler) =>
    chainedHandler({ handler, next: chain });

  chained.onSelect = (fn: () => void) => {
    const handler = selectHandler(fn);
    return chainedHandler({ handler, next: chain });
  };

  return chained;
}

type ChainLink = {
  handler: NavigationHandler;
  next: ChainLink | null;
};

function chainFromArray(arr: NavigationHandler[]): ChainLink | null {
  const head = arr.reduceRight<ChainLink | null>(
    (prev, a) => ({ handler: a, next: prev }),
    null
  );

  return head;
}
