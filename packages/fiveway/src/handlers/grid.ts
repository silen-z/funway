import { type NodeId, directChildId } from "../id.js";
import { traverseNodes } from "../tree.js";
import type { NavigationDirection } from "../navigation.js";
import { type NavigationHandler } from "../handler.js";
import { parentHandler } from "./default.js";
import { focusHandler } from "./focus.js";
import { type Metadata, defineMetadata } from "../metadata.js";
import { type HandlerChain, chainedHandler } from "./chained.js";
import { describeHandler } from "../introspection.js";

export type GridItem = {
  row: number;
  col: number;
};

export const GridItem: Metadata<GridItem> = defineMetadata("core:grid-item");

const distanceFns: Record<
  NavigationDirection,
  (current: GridItem, potential: GridItem) => number | null
> = {
  up: (current, potential) => {
    if (potential.col !== current.col) {
      return null;
    }
    const distance = current.row - potential.row;
    return distance > 0 ? distance : null;
  },
  down: (current, potential) => {
    if (potential.col !== current.col) {
      return null;
    }
    const distance = potential.row - current.row;
    return distance > 0 ? distance : null;
  },

  left: (current, potential) => {
    if (potential.row !== current.row) {
      return null;
    }
    const distance = current.col - potential.col;
    return distance > 0 ? distance : null;
  },
  right: (current, potential) => {
    if (potential.row !== current.row) {
      return null;
    }
    const distance = potential.col - current.col;
    return distance > 0 ? distance : null;
  },
};

/**
 * @category Handler
 */
export const gridMovement: NavigationHandler = (node, action, next) => {
  if (import.meta.env.DEV) {
    describeHandler(action, { name: "core:grid" });
  }

  if (action.kind !== "move" || action.direction === "back") {
    return next();
  }

  const focusedId = directChildId(node.id, node.tree.focusedId);
  if (focusedId === null) {
    return next();
  }

  const focusedPos = GridItem.query(node.tree, focusedId);
  if (focusedPos == null) {
    return next();
  }

  const getDistance = distanceFns[action.direction];

  let closestId: NodeId | null = null;
  let shortestDistance: number | null = null;

  traverseNodes(node.tree, node.id, 1, (id) => {
    const pos = GridItem.query(node.tree, id);
    if (pos === null) {
      return;
    }

    if (next(id, { kind: "focus", direction: null }) === null) {
      return null;
    }

    const distance = getDistance(focusedPos, pos);
    if (distance === null) {
      return;
    }

    if (shortestDistance === null || distance < shortestDistance) {
      closestId = id;
      shortestDistance = distance;
    }
  });

  if (closestId != null) {
    return next(closestId, { kind: "focus", direction: action.direction });
  }

  return next();
};

/**
 * @category Handler
 */
export const gridHandler: HandlerChain = chainedHandler()
  .prepend(parentHandler)
  .prepend(gridMovement)
  .prepend(focusHandler({ skipEmpty: true }));

export const gridItemHandler = GridItem.providerHandler;
