import { childrenIterator } from "../children.js";
import type { NavigationDirection } from "../navigation.js";
import { makeHandler } from "./factory.js";
import { runHandler } from "./runner.js";
import type { ChainableHandler } from "./types.js";

export type FocusDirection = "front" | "back" | undefined;

export type FocusHandlerConfig = {
  direction?: (d: NavigationDirection | "initial" | null) => FocusDirection;
};

export const focusHandler = (
  config: FocusHandlerConfig = {}
): ChainableHandler =>
  makeHandler((node, action, context, next) => {
    if (action.kind !== "focus") {
      return next();
    }

    if (!node.focusable) {
      return null;
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

      const initialNode = node.tree.nodes.get(initialChild.id)!;
      return runHandler(initialNode, action, context);
    }

    const direction = config.direction?.(action.direction);
    const children = childrenIterator(node, direction);

    for (const child of children) {
      if (!child.active) {
        continue;
      }

      const childNode = node.tree.nodes.get(child.id)!;
      const focusableNode = runHandler(childNode, action, context);

      if (focusableNode !== null) {
        return focusableNode;
      }
    }

    return null;
  });
