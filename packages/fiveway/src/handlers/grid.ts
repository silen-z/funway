import { makeHandler, runHandler } from "../handlers.js";
import type { NavigationDirection } from "../navigation.js";
import type { NodeId } from "../node.js";
import { createProvider } from "../provider.js";
import { getNode, traverseNodes } from "../tree.js";
import { parentHandler } from "./default.js";
import { focusHandler } from "./focus.js";

type GridPosition = {
  row: number;
  col: number;
};
export const GridPositionProvider =
  createProvider<GridPosition>("GridPosition");

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

export const gridMovement = makeHandler((node, action, context, next) => {
  if (action.kind !== "move" || action.direction === "back") {
    return next();
  }

  const focusedNode = getNode(node.tree, context.path.at(-1)!);
  const focusedPos = GridPositionProvider.extract(focusedNode);
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
    const closestNode = getNode(node.tree, closestId);
    return runHandler(
      closestNode,
      { kind: "focus", direction: action.direction },
      context
    );
  }

  return null;
});

export const gridHandler = focusHandler()
  .chain(gridMovement)
  .chain(parentHandler);
