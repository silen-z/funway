import { getNode } from "../tree.js";
import { childrenIterator } from "../node.js";
import type { NavigationDirection } from "../navigation.js";
import { makeHandler, runHandler } from "../handlers.js";

type FocusDirection = "front" | "back" | undefined;

type FocusHandlerConfig = {
  direction?: (d: NavigationDirection | "initial" | null) => FocusDirection;
};

export const focusHandler = (config: FocusHandlerConfig = {}) =>
  makeHandler((node, action, context, next) => {
    if (action.kind !== "focus") {
      return next();
    }

    if (node.type === "item") {
      return node.id;
    }

    if (action.direction === "initial" && node.initial !== null) {
      const initialChild = node.children.find(
        (c) => c.active && c.id === node.initial
      );
      if (initialChild == null) {
        return null;
      }

      const initialNode = getNode(node.tree, initialChild.id);
      return runHandler(initialNode, action, context);
    }

    const direction = config.direction?.(action.direction);
    const children = childrenIterator(node, direction);

    for (const child of children) {
      if (!child.active) {
        continue;
      }

      const childNode = getNode(node.tree, child.id);
      const focusableNode = runHandler(childNode, action, context);

      if (focusableNode !== null) {
        return focusableNode;
      }
    }

    return null;
  });
