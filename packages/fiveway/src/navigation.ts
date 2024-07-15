import { type NavigationTree, focusNode, getNode } from "./tree.js";

export type NavigationDirection = "up" | "down" | "left" | "right";
export type NavigationAction =
  | { kind: "select" }
  | { kind: "move"; direction: NavigationDirection | "back" }
  | { kind: "focus"; direction: NavigationDirection | "initial" | null };

export function handleAction(tree: NavigationTree, action: NavigationAction) {
  const node = getNode(tree, tree.focusedId);
  const targetId = node.handler(node, action, { path: [] });
  if (targetId === null) {
    return;
  }

  // TODO maybe not call focusNode right here and return result instead
  focusNode(tree, targetId);
}
