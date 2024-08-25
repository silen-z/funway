import { type NavigationHandler } from "../navigation.js";
import { type HandlerChain, chainedHandler } from "./chained.js";
import { focusHandler } from "./focus.js";
import { describeHandler } from "../introspection.js";

/**
 * @category Handler
 */
export const parentHandler: NavigationHandler = (node, action, next) => {
  if (import.meta.env.DEV) {
    describeHandler(action, { name: "core:parent" });
  }

  if (action.kind === "query") {
    return null;
  }

  if (node.parent !== null) {
    return next(node.parent);
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
