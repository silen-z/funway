import { type NavigationHandler } from "../handler.js";
import { type HandlerChain, chainedHandler } from "./chain.js";
import { focusHandler } from "./focus.js";

/**
 * @category Handler
 */
export const parentHandler: NavigationHandler = (node, action, next) => {
  if (node.parent !== null && action.kind !== "query") {
    return next(node.parent, action);
  }

  return next();
};

/**
 * @category Handler
 */
export const defaultHandler: HandlerChain = chainedHandler()
  .prepend(parentHandler)
  .prepend(focusHandler());

/**
 * @category Handler
 */
export const rootHandler = focusHandler();
