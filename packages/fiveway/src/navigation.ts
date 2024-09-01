import type { NodeId } from "./id.js";
import type { NavigationNode } from "./node.js";
import { type NavigationTree, focusNode } from "./tree.js";

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

export type HandlerNext = (
  id?: NodeId,
  action?: NavigationAction,
) => NodeId | null;

/**
 * @category Handler
 */
export type NavigationHandler = (
  node: NavigationNode,
  action: NavigationAction,
  next: HandlerNext,
) => NodeId | null;

export function runHandler(
  tree: NavigationTree,
  nodeId: NodeId,
  action: NavigationAction,
): NodeId | null {
  const next: HandlerNext = (id, newAction) => {
    if (id == null) {
      return null;
    }

    return runHandler(tree, id, newAction ?? action);
  };

  const node = tree.nodes.get(nodeId);
  if (node == null || !node.connected) {
    return null;
  }

  return node.handler(node, action, next);
}

export function handleAction(tree: NavigationTree, action: NavigationAction) {
  const targetId = runHandler(tree, tree.focusedId, action);
  if (targetId !== null) {
    focusNode(tree, targetId);
  }
}
