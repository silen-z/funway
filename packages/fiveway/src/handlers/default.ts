import {
  type NavigationHandler,
  type HandlerChain,
  chainHandlers,
} from "../handler.js";
import { focusHandler } from "./focus.js";

/**
 * @category Handler
 */
export const parentHandler: NavigationHandler = (node, action, next) => {
  if (node.parent !== null) {
    return next(node.parent, action);
  }

  return next();
};

/**
 * @category Handler
 */
export const defaultHandler: HandlerChain = chainHandlers(
  focusHandler(),
  parentHandler
);

/**
 * @category Handler
 */
export const rootHandler = focusHandler();

/**
 * @category Handler
 */
export function selectHandler(onSelect: () => void) {
  return defaultHandler.prepend((_, action, next) => {
    if (action.kind === "select") {
      onSelect();
      return null;
    }

    return next();
  });
}
