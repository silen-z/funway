import type { NodeId } from "./id.js";
import type { NavigationAction } from "./navigation.js";
import type { NavigationNode } from "./node.js";
import { getNode, type NavigationTree } from "./tree.js";

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
