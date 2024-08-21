import type { NavigationNode } from "../node.js";
import { type NodeId, directChildId } from "../id.js";
import type { NavigationAction, NavigationDirection } from "../navigation.js";
import type { HandlerNext } from "../handler.js";
import { type HandlerChain, chainedHandler } from "./chain.js";
import { parentHandler } from "./default.js";
import { focusHandler } from "./focus.js";

/**
 * @category Handler
 */
export function verticalMovementHandler(
  node: NavigationNode,
  action: NavigationAction,
  next: HandlerNext
) {
  if (action.kind !== "move") {
    return next();
  }

  if (action.direction === "up") {
    const previousId = findPreviousChild(node, (id) =>
      next(id, { kind: "focus", direction: "up" })
    );

    return previousId ?? next();
  }

  if (action.direction === "down") {
    const nextId = findNextChild(node, (id) =>
      next(id, { kind: "focus", direction: "down" })
    );

    return nextId ?? next();
  }

  return next();
}

function verticalFocusDirection(dir: NavigationDirection | "initial" | null) {
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
export const verticalHandler: HandlerChain = chainedHandler()
  .prepend(parentHandler)
  .prepend(verticalMovementHandler)
  .prepend(
    focusHandler({
      skipEmpty: true,
      direction: verticalFocusDirection,
    })
  );

/**
 * @category Handler
 */
export function horizontalMovementHandler(
  node: NavigationNode,
  action: NavigationAction,
  next: HandlerNext
) {
  if (action.kind !== "move") {
    return next();
  }

  if (action.direction === "left") {
    const previousId = findPreviousChild(node, (id) =>
      next(id, { kind: "focus", direction: "left" })
    );

    return previousId ?? next();
  }

  if (action.direction === "right") {
    const nextId = findNextChild(node, (id) =>
      next(id, { kind: "focus", direction: "right" })
    );

    return nextId ?? next();
  }

  return next();
}

function horizontalFocusDirection(dir: NavigationDirection | "initial" | null) {
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
export const horizontalHandler: HandlerChain = chainedHandler()
  .prepend(parentHandler)
  .prepend(horizontalMovementHandler)
  .prepend(
    focusHandler({
      skipEmpty: true,
      direction: horizontalFocusDirection,
    })
  );

function findNextChild(
  node: NavigationNode,
  check: (id: NodeId) => NodeId | null
) {
  const currentChildId = directChildId(node.id, node.tree.focusedId);
  if (currentChildId === null) {
    return null;
  }

  const currentIndex = node.children.findIndex((c) => c.id === currentChildId);

  for (let i = currentIndex + 1; i < node.children.length; i++) {
    const child = node.children[i]!;
    if (!child.active) {
      continue;
    }

    const nextId = check(child.id);
    if (nextId !== null) {
      return nextId;
    }
  }

  return null;
}

function findPreviousChild(
  node: NavigationNode,
  check: (id: NodeId) => NodeId | null
) {
  const currentChildId = directChildId(node.id, node.tree.focusedId);
  if (currentChildId === null) {
    return null;
  }

  const currentIndex = node.children.findIndex((c) => c.id === currentChildId);

  for (let i = currentIndex - 1; i >= 0; i--) {
    const child = node.children[i]!;
    if (!child.active) {
      continue;
    }

    const nextId = check(child.id);
    if (nextId !== null) {
      return nextId;
    }
  }

  return null;
}
