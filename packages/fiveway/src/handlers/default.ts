import type { NavigationHandler } from "../navigation.js";
import { chainedHandler } from "./chained.js";
import { focusHandler } from "./focus.js";
import { describeHandler } from "../introspection.js";
import { selectHandler } from "./select.js";

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
export const defaultHandler = chainedHandler([focusHandler(), parentHandler]);

/**
 * @category Handler
 */
export const containerHandler = chainedHandler([
  focusHandler({ skipEmpty: true }),
  parentHandler,
]);

/**
 * @category Handler
 */
export const itemHandler = (onSelect?: () => void) => {
  if (onSelect == null) {
    return defaultHandler;
  }

  return defaultHandler.prepend(selectHandler(onSelect));
};
