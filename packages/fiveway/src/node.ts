import { createGlobalId, type NodeId } from "./id.js";
import { type NavigationTree, getNode } from "./tree.js";
import type { NavigationHandler } from "./handler.js";
import { defaultHandler } from "./handlers/default.js";
import { binarySearch } from "./array.js";

export type NavigationNode = {
  tree: NavigationTree;
  id: NodeId;
  connected: boolean;
  parent: NodeId | null;
  order: number | null;
  handler: NavigationHandler;
  children: NodeChild[];
};

export type NodeChild = { id: NodeId; order: number | null; active: boolean };

export type NodeConfig = {
  id: string;
  parent: NodeId;
  order?: number;
  handler?: NavigationHandler;
};

export function createNode(
  tree: NavigationTree,
  options: NodeConfig
): NavigationNode {
  const globalId = createGlobalId(options.parent, options.id);

  return {
    tree,
    id: globalId,
    connected: false,
    parent: options.parent,
    order: options.order ?? null,
    handler: options.handler ?? defaultHandler,
    children: [],
  };
}

export type ContainerConfig = NodeConfig & {
  initial?: NodeId;
  rememberChildren?: boolean;
};

export function updateNode<N extends NavigationNode>(
  node: N,
  options: Omit<NodeConfig, "id" | "parent">
) {
  if (options.handler != null) {
    node.handler = options.handler;
  }

  if (options.order != null) {
    updateNodeOrder(node, options.order);
  }
}

function updateNodeOrder(node: NavigationNode, order: number) {
  if (node.order !== order && node.parent !== null) {
    node.order = order;

    // update children inside parent
    // TODO handle parent not being connected
    const parentNode = getNode(node.tree, node.parent);

    const childIndex = parentNode.children.findIndex((i) => i.id === node.id);
    const newIndex = binarySearch(
      parentNode.children,
      // TODO handle null in order better?
      (child) => order < (child.order ?? 0)
    );

    if (newIndex === -1 || newIndex === childIndex) {
      return;
    }

    parentNode.children[childIndex!]!.order = order;
    const removed = parentNode.children.splice(childIndex, 1);
    parentNode.children.splice(newIndex, 0, ...removed);
  }
}
