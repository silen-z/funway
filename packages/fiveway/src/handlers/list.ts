import type { NavigationContainer, NodeId } from "../node.js";
import { getNode } from "../tree.js";
import { makeHandler, runHandler } from "../handlers.js";
import { parentHandler } from "./default.js";
import { focusHandler } from "./focus.js";

export const verticalMovement = makeHandler((node, action, context, next) => {
  if (node.type !== "container") {
    throw Error("verticalList handler can only be used on containers");
  }

  if (action.kind === "move") {
    switch (action.direction) {
      case "up": {
        let childId = context.path.at(-1) ?? node.tree.focusedId;

        for (;;) {
          const prevChildId = previousChild(node, childId);
          if (prevChildId === null) {
            return next();
          }

          const childNode = getNode(node.tree, prevChildId);
          const targetNode = runHandler(
            childNode,
            { kind: "focus", direction: action.direction },
            context
          );

          if (targetNode === null) {
            childId = prevChildId;
            continue;
          }

          return targetNode;
        }
      }
      case "down": {
        let childId = context.path.at(-1) ?? node.tree.focusedId;

        for (;;) {
          const nextChildId = nextChild(node, childId);
          if (nextChildId === null) {
            return next();
          }

          const childNode = getNode(node.tree, nextChildId);
          const targetNode = runHandler(
            childNode,
            { kind: "focus", direction: action.direction },
            context
          );

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
});

export const verticalList = focusHandler({
  direction: (dir) => (dir === "up" ? "back" : undefined),
})
  .chain(verticalMovement)
  .chain(parentHandler);

export const horizontalMovement = makeHandler((node, action, context, next) => {
  if (node.type !== "container") {
    throw Error("horizontalList handler can only be used on containers");
  }

  if (action.kind === "move") {
    switch (action.direction) {
      case "left": {
        let childId = context.path.at(-1) ?? node.tree.focusedId;

        for (;;) {
          const prevChildId = previousChild(node, childId);
          if (prevChildId === null) {
            return next();
          }

          const childNode = getNode(node.tree, prevChildId);
          const targetNode = runHandler(
            childNode,
            { kind: "focus", direction: action.direction },
            context
          );

          if (targetNode === null) {
            childId = prevChildId;
            continue;
          }

          return targetNode;
        }
      }

      case "right": {
        let childId = context.path.at(-1) ?? node.tree.focusedId;

        for (;;) {
          const nextChildId = nextChild(node, childId);
          if (nextChildId === null) {
            return next();
          }

          const childNode = getNode(node.tree, nextChildId);
          const targetNode = runHandler(
            childNode,
            { kind: "focus", direction: action.direction },
            context
          );

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
});

export const horizontalList = focusHandler({
  direction: (dir) => (dir === "left" ? "back" : undefined),
})
  .chain(horizontalMovement)
  .chain(parentHandler);

function previousChild(
  node: NavigationContainer,
  nodeId: NodeId
): NodeId | null {
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

function nextChild(node: NavigationContainer, nodeId: NodeId): NodeId | null {
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
