import { type NavigationTree, focusNode } from "./tree.js";
import { runHandler } from "./handler.js";

export type NavigationDirection = "up" | "down" | "left" | "right";

export type DefaultNavigationAction =
  | { kind: "select" }
  | { kind: "move"; direction: NavigationDirection | "back" }
  | { kind: "focus"; direction: NavigationDirection | "initial" | null };

export interface Register {
  // action: DefaultNavigationAction;
}

// How to register custom action
// declare module "@fiveway/core" {
//   interface Register {
//     action: DefaultNavigationAction | { kind: "custom" };
//   }
// }

export type NavigationAction = Register extends {
  action: infer Action;
}
  ? Action
  : DefaultNavigationAction;

export function handleAction(tree: NavigationTree, action: NavigationAction) {
  const targetId = runHandler(tree, tree.focusedId, action);
  if (targetId !== null) {
    focusNode(tree, targetId);
  }
}
