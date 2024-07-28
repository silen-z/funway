import { directChildId, type NodeId } from "../id.js";
import { getNode, traverseNodes } from "../tree.js";
import type { NavigationDirection } from "../navigation.js";
import {
  type NavigationHandler,
  type HandlerChain,
  chainHandlers,
} from "../handler.js";
import { parentHandler } from "./default.js";
import { focusHandler } from "./focus.js";
import { createProvider, type Provider } from "../provider.js";

export type GridPosition = {
  row: number;
  col: number;
};
export const GridPositionProvider: Provider<GridPosition> =
  createProvider("GridPosition");

const distanceFns: Record<
  NavigationDirection,
  (current: GridPosition, potential: GridPosition) => number | null
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
  if (action.kind !== "move" || action.direction === "back") {
    return next();
  }

  const focusedId = directChildId(node.id, node.tree.focusedId);
  if (focusedId === null) {
    return next();
  }

  const focusedPos = GridPositionProvider.extract(
    getNode(node.tree, focusedId)
  );
  if (focusedPos == null) {
    return next();
  }

  const getDistance = distanceFns[action.direction];

  let closestId: NodeId | null = null;
  let shortestDistance: number | null = null;

  traverseNodes(node.tree, node.id, (potentialNode) => {
    // TODO use focus handler?
    if (!potentialNode.focusable) {
      return;
    }

    const potentialPos = GridPositionProvider.extract(potentialNode);
    if (potentialPos == null) {
      return;
    }

    const distance = getDistance(focusedPos, potentialPos);
    if (distance === null) {
      return;
    }

    if (shortestDistance === null || distance < shortestDistance) {
      closestId = potentialNode.id;
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
export const gridHandler: HandlerChain = chainHandlers(
  focusHandler(),
  gridMovement,
  parentHandler
);
