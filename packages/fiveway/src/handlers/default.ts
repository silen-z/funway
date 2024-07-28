import { selectNode } from "../tree.js";
import { type ChainableHandler, makeHandler } from "../handler.js";
import { focusHandler } from "./focus.js";

/**
 * @category Handler
 */
export const parentHandler: ChainableHandler = makeHandler(
  (node, action, next, context) => {
    if (node.parent !== null) {
      context.path.push(node.id);
      return next(node.parent, action);
    }

    return next();
  }
);

/**
 * @category Handler
 */
export const selectHandler = makeHandler((node, action, next) => {
  if (action.kind === "select") {
    selectNode(node.tree, node.id, true);
    return null;
  }

  return next();
});

/**
 * @category Handler
 */
export const rootHandler = focusHandler();

/**
 * @category Handler
 */
export const itemHandler = focusHandler()
  .append(selectHandler)
  .append(parentHandler);

/**
 * @category Handler
 */
export const containerHandler = focusHandler().append(parentHandler);
