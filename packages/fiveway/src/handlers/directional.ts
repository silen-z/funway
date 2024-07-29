import { type NodeId, directChildId } from "../id.js";
import type { ContainerNode } from "../node.js";
import {
  type NavigationHandler,
  type HandlerChain,
  chainHandlers,
} from "../handler.js";
import { parentHandler } from "./default.js";
import { type FocusDirection, focusHandler } from "./focus.js";
import type { NavigationDirection } from "../navigation.js";

/**
 * @category Handler
 */
export const verticalMovement: NavigationHandler = (node, action, next) => {
  if (node.type !== "container") {
    throw Error("verticalList handler can only be used on containers");
  }

  if (action.kind === "move") {
    switch (action.direction) {
      case "up": {
        let childId = directChildId(node.id, node.tree.focusedId);
        if (childId === null) {
          return next();
        }

        for (;;) {
          const prevChildId = previousChild(node, childId);
          if (prevChildId === null) {
            return next();
          }

          const targetNode = next(prevChildId, {
            kind: "focus",
            direction: action.direction,
          });

          if (targetNode === null) {
            childId = prevChildId;
            continue;
          }

          return targetNode;
        }
      }
      case "down": {
        let childId = directChildId(node.id, node.tree.focusedId);
        if (childId === null) {
          return next();
        }

        for (;;) {
          const nextChildId = nextChild(node, childId);
          if (nextChildId === null) {
            return next();
          }

          const targetNode = next(nextChildId, {
            kind: "focus",
            direction: action.direction,
          });

          if (targetNode === null) {
            childId = nextChildId;
            continue;
          }

          return targetNode;
        }
      }
    }
  }

  return next();
};

function verticalFocusDirection(
  dir: NavigationDirection | "initial" | null
): FocusDirection {
  if (dir === "up") {
    return "back";
  }

  if (dir === "down") {
    return "front";
  }
}

/**
 * @category Handler
 */
export const verticalHandler: HandlerChain = chainHandlers(
  focusHandler({ direction: verticalFocusDirection }),
  verticalMovement,
  parentHandler
);

/**
 * @category Handler
 */
export const horizontalMovement: NavigationHandler = (node, action, next) => {
  if (node.type !== "container") {
    throw Error("horizontalList handler can only be used on containers");
  }

  if (action.kind === "move") {
    switch (action.direction) {
      case "left": {
        let childId = directChildId(node.id, node.tree.focusedId);
        if (childId === null) {
          return next();
        }

        for (;;) {
          const prevChildId = previousChild(node, childId);
          if (prevChildId === null) {
            return next();
          }

          const targetNode = next(prevChildId, {
            kind: "focus",
            direction: action.direction,
          });

          if (targetNode === null) {
            childId = prevChildId;
            continue;
          }

          return targetNode;
        }
      }

      case "right": {
        let childId = directChildId(node.id, node.tree.focusedId);
        if (childId === null) {
          return next();
        }
        for (;;) {
          const nextChildId = nextChild(node, childId);
          if (nextChildId === null) {
            return next();
          }

          const targetNode = next(nextChildId, {
            kind: "focus",
            direction: action.direction,
          });

          if (targetNode === null) {
            childId = nextChildId;
            continue;
          }

          return targetNode;
        }
      }
    }
  }

  return next();
};

function horizontalFocusDirection(
  dir: NavigationDirection | "initial" | null
): FocusDirection {
  if (dir === "left") {
    return "back";
  }

  if (dir === "right") {
    return "front";
  }
}

/**
 * @category Handler
 */
export const horizontalHandler: HandlerChain = chainHandlers(
  focusHandler({ direction: horizontalFocusDirection }),
  horizontalMovement,
  parentHandler
);

function previousChild(node: ContainerNode, nodeId: NodeId): NodeId | null {
  const currentIndex = node.children.findIndex((child) => child.id === nodeId);

  if (currentIndex === -1) {
    throw new Error("unexpected");
  }

  let prexIndex = currentIndex - 1;
  while (prexIndex >= 0) {
    if (node.children[prexIndex]?.active) {
      return node.children[prexIndex]!.id;
    }
    prexIndex -= 1;
  }

  return null;
}

function nextChild(node: ContainerNode, nodeId: NodeId): NodeId | null {
  const currentIndex = node.children.findIndex((child) => child.id === nodeId);

  if (currentIndex === -1) {
    throw new Error("unexpected");
  }

  let nextIndex = currentIndex + 1;
  while (nextIndex < node.children.length) {
    if (node.children[nextIndex]?.active) {
      return node.children[nextIndex]!.id;
    }
    nextIndex += 1;
  }

  return null;
}
