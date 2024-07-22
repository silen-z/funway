import type { NavigationAction } from "../navigation.js";
import type { NavigationNode, NodeId } from "../node.js";

export type NavigationHandlerContext = {
  path: NodeId[];
};

export type NavigationHandler = (
  node: NavigationNode,
  action: NavigationAction,
  context: NavigationHandlerContext,
  next: () => NodeId | null
) => NodeId | null;

export type ChainableHandler = NavigationHandler & {
  chain(another: NavigationHandler | ChainableHandler): ChainableHandler;
};
