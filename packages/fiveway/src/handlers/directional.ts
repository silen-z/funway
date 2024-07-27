import type { ContainerNode, NodeId } from "../node.js";
import { parentHandler } from "./default.js";
import { type ChainableHandler, makeHandler } from "../handler.js";
import { focusHandler } from "./focus.js";

export const verticalMovement: ChainableHandler = makeHandler(
  (node, action, next, context) => {
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
          let childId = context.path.at(-1) ?? node.tree.focusedId;

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
  }
);

export const verticalHandler = focusHandler({
  direction: (dir) => (dir === "up" ? "back" : undefined),
})
  .append(verticalMovement)
  .append(parentHandler);

export const horizontalMovement = makeHandler((node, action, next, context) => {
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
        let childId = context.path.at(-1) ?? node.tree.focusedId;

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
});

export const horizontalHandler = focusHandler({
  direction: (dir) => (dir === "left" ? "back" : undefined),
})
  .append(horizontalMovement)
  .append(parentHandler);

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
