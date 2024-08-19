import type { NavigationDirection } from "../navigation.js";
import { type NavigationHandler } from "../handler.js";
import { isParent } from "../id.js";

export type FocusDirection = "front" | "back";

export type FocusHandlerConfig = {
  direction?: (
    d: NavigationDirection | "initial" | null
  ) => FocusDirection | undefined;
};

/**
 * @category Handler
 * @param config
 * @returns
 */
function createFocusHandler(config: FocusHandlerConfig = {}) {
  const focusHandler: NavigationHandler = (node, action, next) => {
    if (action.kind !== "focus") {
      return next();
    }

    if (node.type === "item") {
      return node.id;
    }

    const direction = config.direction?.(action.direction) ?? "front";

    if (direction === "back") {
      for (let i = node.children.length - 1; i >= 0; i--) {
        const child = node.children[i]!;
        if (!child.active) {
          continue;
        }

        const nextId = next(child.id);
        if (nextId !== null) {
          return nextId;
        }
      }

      return null;
    }

    for (let i = 0; i < node.children.length; i++) {
      const child = node.children[i]!;
      if (!child.active) {
        continue;
      }

      const nextId = next(child.id);
      if (nextId !== null) {
        return nextId;
      }
    }

    return null;
  };

  return focusHandler;
}

export const captureHandler: NavigationHandler = (node, _, next) => {
  const id = next();
  if (id === null || !isParent(node.id, id)) {
    return null;
  }

  return id;
};

function createInitialHandler(id: string) {
  const initialHandler: NavigationHandler = (node, action, next) => {
    const initialId = `${node.id}/${id}`;

    if (node.type !== "container" || action.kind !== "focus") {
      return next();
    }

    if (action.direction === "initial") {
      const child = node.children.find((c) => c.active && c.id === initialId);
      if (child == null) {
        return null;
      }

      return next(initialId);
    }

    if (action.direction === null) {
      const child = node.children.find((c) => c.active && c.id === initialId);

      if (child != null) {
        return next(child.id);
      }
    }

    return next();
  };

  return initialHandler;
}

export {
  createFocusHandler as focusHandler,
  createInitialHandler as initialHandler,
};
