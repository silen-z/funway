import type { NodeId } from "./id.js";
import type { NavigationNode } from "./node.js";
import { type NavigationTree, getNode, focusNode } from "./tree.js";

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

export type HandlerNext = {
  (): NodeId | null;
  (id: NodeId, action?: NavigationAction): NodeId | null;
};

/**
 * @category Handler
 */
export type NavigationHandler = (
  node: NavigationNode,
  action: NavigationAction,
  next: HandlerNext
) => NodeId | null;

export function runHandler(
  tree: NavigationTree,
  id: NodeId,
  action: NavigationAction
): NodeId | null {
  const nextHandler = (id?: NodeId, anotherAction?: NavigationAction) => {
    if (id != null) {
      try {
        getNode(tree, id);
      } catch {
        return null;
      }

      return runHandler(tree, id, anotherAction ?? action);
    }

    return null;
  };

  const node = getNode(tree, id);
  return node.handler(node, action, nextHandler);
}

export function handleAction(tree: NavigationTree, action: NavigationAction) {
  const targetId = runHandler(tree, tree.focusedId, action);
  if (targetId !== null) {
    focusNode(tree, targetId);
  }
}
