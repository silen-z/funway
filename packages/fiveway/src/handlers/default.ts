import { type NavigationHandler } from "../handler.js";
import { type HandlerChain, chainedHandler } from "./chain.js";
import { focusHandler } from "./focus.js";
import { handlerInfo } from "../introspection.js";

/**
 * @category Handler
 */
export const parentHandler: NavigationHandler = (node, action, next) => {
  if (import.meta.env.DEV) {
    handlerInfo(action, { name: "core:parent" });
  }

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

export const containerHandler: HandlerChain = chainedHandler()
  .prepend(parentHandler)
  .prepend(focusHandler({ skipEmpty: true }));
