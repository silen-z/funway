import type { NavigationAction } from "../navigation.js";
import type { NavigationNode, NodeId } from "../node.js";
import type { NavigationHandlerContext } from "./types.js";

const finalHandler = () => null;

export function runHandler(
  node: NavigationNode,
  action: NavigationAction,
  context: NavigationHandlerContext = { path: [] }
): NodeId | null {
  return node.handler(node, action, context, finalHandler);
}
