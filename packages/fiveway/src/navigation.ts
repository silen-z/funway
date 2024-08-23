import { type NavigationTree, focusNode } from "./tree.js";
import { runHandler } from "./handler.js";

export type NavigationDirection = "up" | "down" | "left" | "right";

export type DefaultNavigationAction =
  | { kind: "select" }
  | { kind: "move"; direction: NavigationDirection | "back" }
  | { kind: "focus"; direction: NavigationDirection | "initial" | null }
  | { kind: "query"; key: string; value: unknown | null };

// This interface provides a way to extend the default actions:
//
// declare module "@fiveway/core" {
//   interface Register {
//     action: DefaultNavigationAction | { kind: "my-custom-action" };
//   }
// }
//
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface Register {}

export type NavigationAction = Register extends {
  action: infer ExtendedAction;
}
  ? ExtendedAction
  : DefaultNavigationAction;

export function handleAction(tree: NavigationTree, action: NavigationAction) {
  const targetId = runHandler(tree, tree.focusedId, action);
  if (targetId !== null) {
    focusNode(tree, targetId);
  }
}
