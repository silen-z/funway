import { childrenIterator } from "../children.js";
import type { NavigationDirection } from "../navigation.js";
import { type NavigationHandler } from "../handler.js";
import { isParent } from "../id.js";

export type FocusDirection = "front" | "back" | undefined;

export type FocusHandlerConfig = {
  direction?: (d: NavigationDirection | "initial" | null) => FocusDirection;
};

/**
 * @category Handler
 * @param config
 * @returns
 */
export function focusHandler(
  config: FocusHandlerConfig = {}
): NavigationHandler {
  return (node, action, next) => {
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

      return next(initialChild.id, action);
    }

    const direction = config.direction?.(action.direction);
    const children = childrenIterator(node, direction);

    for (const child of children) {
      if (!child.active) {
        continue;
      }

      const focusableNode = next(child.id, action);

      if (focusableNode !== null) {
        return focusableNode;
      }
    }

    return null;
  };
}

export const captureHandler: NavigationHandler = (node, _, next) => {
  const id = next();
  if (id === null || !isParent(node.id, id)) {
    return null;
  }

  return id;
};
