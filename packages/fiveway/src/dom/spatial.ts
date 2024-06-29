import {
  type NavigationAction,
  type NavigationNode,
  type NodeId,
  getItemNode,
  parentHandler,
  traverseNodes,
  createProvider,
} from "../index.js";
import { childFocusHandler } from "../navigation.js";

export const PositionProvider = createProvider<DOMRect>("position");

export function spatial(
  node: NavigationNode,
  action: NavigationAction,
  context: {
    path: NodeId[];
  }
) {
  if (action.kind === "focus") {
    return childFocusHandler(node, action, context);
  }

  if (action.kind === "select") {
    return parentHandler(node, action, context);
  }

  const focusedNode = getItemNode(node.tree, node.tree.focusedId);
  const focusedPos = PositionProvider.extract(focusedNode);
  if (focusedPos == null || action.direction === "back") {
    return parentHandler(node, action, context);
  }

  const isCorrectDirection = directionFilters[action.direction];

  let closestId: NodeId | null = null;
  let shortestDistance: number | null = null;

  traverseNodes(node.tree, node.id, (potentialNode) => {
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

  return closestId ?? parentHandler(node, action, context);
}

type NavigationDirection = "up" | "down" | "left" | "right";
const directionFilters: Record<
  NavigationDirection,
  (current: DOMRect, potential: DOMRect) => boolean
> = {
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
