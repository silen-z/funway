import { focusHandler } from "./focus.js";
import type { NavigationDirection } from "../navigation.js";
import {
  type ChainableHandler,
  makeHandler,
  chainHandlers,
} from "../handler.js";
import type { NodeId } from "../id.js";
import { createProvider, type Provider } from "../provider.js";
import { getItemNode, traverseNodes } from "../tree.js";
import { parentHandler } from "./default.js";

export const PositionProvider: Provider<DOMRect> = createProvider("position");

/**
 * @category Handler
 */
export const spatialMovement: ChainableHandler = makeHandler(
  (node, action, next) => {
    if (action.kind !== "move" || action.direction === "back") {
      return next();
    }

    const focusedNode = getItemNode(node.tree, node.tree.focusedId);
    const focusedPos = PositionProvider.extract(focusedNode);
    if (focusedPos == null) {
      return next();
    }

    const isCorrectDirection = directionFilters[action.direction];

    let closestId: NodeId | null = null;
    let shortestDistance: number | null = null;

    traverseNodes(node.tree, node.id, (potentialNode) => {
      // TODO use focus handler?
      if (!potentialNode.focusable) {
        return;
      }

      const potentialPos = PositionProvider.extract(potentialNode);
      if (potentialPos == null) {
        return;
      }

      if (!isCorrectDirection(focusedPos, potentialPos)) {
        return;
      }

      const distance = distanceSquared(focusedPos, potentialPos);
      if (shortestDistance === null || distance < shortestDistance) {
        closestId = potentialNode.id;
        shortestDistance = distance;
      }
    });

    return closestId ?? next();
  }
);

/**
 * @category Handler
 */
export const spatialHandler = chainHandlers(
  focusHandler(),
  spatialMovement,
  parentHandler
);

type DirectionFilter = (current: DOMRect, potential: DOMRect) => boolean;

const directionFilters: Record<NavigationDirection, DirectionFilter> = {
  up: (current, potential) =>
    Math.floor(potential.bottom) <= Math.ceil(current.top),
  down: (current, potential) =>
    Math.ceil(potential.top) >= Math.floor(current.bottom),
  left: (current, potential) =>
    Math.floor(potential.right) <= Math.ceil(current.left),
  right: (current, potential) =>
    Math.ceil(potential.left) >= Math.floor(current.right),
};

function distanceSquared(a: DOMRect, b: DOMRect) {
  const ax = a.left + a.width * 0.5;
  const ay = a.top + a.height * 0.5;

  const bx = b.left + b.width * 0.5;
  const by = b.top + b.height * 0.5;

  const dx = ax - bx;
  const dy = ay - by;

  return dx * dx + dy * dy;
}
