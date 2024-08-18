import { createGlobalId, type NodeId } from "./id.js";
import { type NavigationTree, getContainerNode } from "./tree.js";
import type { NavigationHandler } from "./handler.js";
import { defaultHandler } from "./handlers/default.js";
import { binarySearch } from "./array.js";

export type NodeBase = {
  tree: NavigationTree;
  id: NodeId;
  connected: boolean;
  parent: NodeId | null;
  order: number | null;
  handler: NavigationHandler;
};


export type NodeChild = { id: NodeId; order: number | null; active: boolean };

export type ContainerNode = NodeBase & {
  type: "container";
  children: NodeChild[];
  rememberChildren: boolean;
};

export type ItemNode = NodeBase & {
  type: "item";
};

export type NavigationNode = ContainerNode | ItemNode;

export type NodeConfig = {
  id: string;
  parent: NodeId;
  order?: number;
  handler?: NavigationHandler;
};

export type ItemConfig = NodeConfig;

export function createItemNode(
  tree: NavigationTree,
  options: ItemConfig
): ItemNode {
  const globalId = createGlobalId(options.parent, options.id);

  return {
    type: "item",
    tree,
    id: globalId,
    connected: false,
    parent: options.parent,
    order: options.order ?? null,
    handler: options.handler ?? defaultHandler,
  };
}

export type ContainerConfig = NodeConfig & {
  initial?: NodeId;
  rememberChildren?: boolean;
};

export function createContainerNode(
  tree: NavigationTree,
  options: ContainerConfig
): ContainerNode {
  const globalId = createGlobalId(options.parent, options.id);

  return {
    type: "container",
    tree,
    id: globalId,
    connected: false,
    parent: options.parent,
    order: options.order ?? null,
    handler: options.handler ?? defaultHandler,
    children: [],
    rememberChildren: options.rememberChildren ?? true,
  };
}

export function updateNode(
  node: ItemNode,
  config: Omit<ItemConfig, "id" | "parent">
): void;
export function updateNode(
  node: ContainerNode,
  config: Omit<ContainerConfig, "id" | "parent">
): void;
export function updateNode<N extends NavigationNode>(
  node: N,
  options: Omit<ItemConfig & ContainerConfig, "id" | "parent">
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
    const parentNode = getContainerNode(node.tree, node.parent);

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
