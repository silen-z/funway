import type { NavigationDirection, NavigationHandler } from "../navigation.js";
import { type NodeId, isParent } from "../id.js";
import { describeHandler } from "../introspection.js";
import { defineMetadata } from "../metadata.js";

export type FocusDirection = "front" | "back";

export type FocusHandlerConfig = {
  skipEmpty?: boolean;
  direction?: (
    dir: NavigationDirection | "initial" | null,
  ) => FocusDirection | null;
};

const InitialFocus = defineMetadata<NodeId>("core:initial");

export const initialHandler = InitialFocus.providerHandler;

function createFocusHandler(config: FocusHandlerConfig = {}) {
  const skipEmpty = config.skipEmpty ?? false;

  const focusHandler: NavigationHandler = (node, action, next) => {
    if (import.meta.env.DEV) {
      describeHandler(action, {
        name: "core:focus",
        skipEmpty,
        direction: config.direction != null ? "custom" : "default",
      });
    }

    if (action.kind !== "focus") {
      return next();
    }

    if (!node.children.some((c) => c.active)) {
      if (skipEmpty) {
        return null;
      }

      return node.id;
    }

    const focusDirection = config.direction?.(action.direction) ?? null;

    initialFocus: {
      if (focusDirection !== null) {
        break initialFocus;
      }

      const localId = InitialFocus.query(node.tree, node.id);
      if (localId === null) {
        break initialFocus;
      }

      const initialId = `${node.id}/${localId}`;
      const child = node.children.find((c) => c.active && c.id === initialId);
      if (child == null) {
        break initialFocus;
      }

      const childId = next(child.id);
      if (childId !== null) {
        return childId;
      }
    }

    if (focusDirection === "back") {
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

export const captureHandler: NavigationHandler = (node, action, next) => {
  if (import.meta.env.DEV) {
    describeHandler(action, { name: "core:capture" });
  }

  const id = next();
  if (id === null || !isParent(node.id, id)) {
    return null;
  }

  return id;
};

export { createFocusHandler as focusHandler };
