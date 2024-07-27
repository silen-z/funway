import { type NavigationTree, focusNode } from "./tree.js";
import { runHandler } from "./handler.js";

export type NavigationDirection = "up" | "down" | "left" | "right";
export type NavigationAction =
  | { kind: "select" }
  | { kind: "move"; direction: NavigationDirection | "back" }
  | { kind: "focus"; direction: NavigationDirection | "initial" | null };

export function handleAction(tree: NavigationTree, action: NavigationAction) {
  const targetId = runHandler(tree, tree.focusedId, action);
  if (targetId !== null) {
    focusNode(tree, targetId);
  }
}
