import type { NodeId } from "./id.js";
import type { NavtreeNode } from "./node.js";
import { type NavigationTree, focusNode } from "./tree.js";

export type NavigationDirection = "up" | "down" | "left" | "right";

// This interface provides a way to extend the default actions:
//
// declare module "@fiveway/core" {
//   interface NavigationActions {
//     custom: { kind: "my-custom-action", customValue: string };
//   }
// }
export interface NavigationActions {
  select: { kind: "select" };
  move: { kind: "move"; direction: NavigationDirection | "back" };
  focus: { kind: "focus"; direction: NavigationDirection | "initial" | null };
  query: { kind: "query"; key: string; value: unknown | null };
}

export type NavigationAction = NavigationActions[keyof NavigationActions];

export type HandlerNext = (
  id?: NodeId,
  action?: NavigationAction,
) => NodeId | null;

/**
 * @category Handler
 */
export type NavigationHandler = (
  node: NavtreeNode,
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
