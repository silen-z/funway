import { selectNode } from "../tree.js";
import {
  type NavigationHandler,
  type HandlerChain,
  chainHandlers,
} from "../handler.js";
import { focusHandler } from "./focus.js";
import type { NavigationAction } from "../navigation.js";

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
export const selectHandler: NavigationHandler = (node, action, next) => {
  if (action.kind === "select") {
    selectNode(node.tree, node.id, true);
    return null;
  }

  return next();
};

/**
 * @category Handler
 */
export const rootHandler = focusHandler();

/**
 * @category Handler
 */
export const itemHandler: HandlerChain = chainHandlers(
  focusHandler(),
  selectHandler,
  parentHandler
);

/**
 * @category Handler
 */
export const containerHandler: HandlerChain = chainHandlers(
  focusHandler(),
  parentHandler
);
