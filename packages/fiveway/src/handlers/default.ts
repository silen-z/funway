import { selectNode } from "../tree.js";
import { makeHandler } from "./factory.js";
import { focusHandler } from "./focus.js";
import { runHandler } from "./runner.js";

import type { ChainableHandler } from "./types.js";

export const parentHandler: ChainableHandler = makeHandler((node, action, context, next) => {
  if (node.parent !== null) {
    const parentNode = node.tree.nodes.get(node.parent)!;

    context.path.push(node.id);
    return runHandler(parentNode, action, context);
  }

  return next();
});

export const selectHandler = makeHandler((node, action, _, next) => {
  if (action.kind === "select") {
    selectNode(node.tree, node.id, true);
    return null;
  }

  return next();
});

export const rootHandler = focusHandler();

export const itemHandler = focusHandler()
  .chain(selectHandler)
  .chain(parentHandler);

export const containerHandler = focusHandler().chain(parentHandler);
