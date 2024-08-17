import { createGlobalId, scopedId, type NodeId } from "./id.js";
import { type NavigationTree, getContainerNode } from "./tree.js";
import type { NavigationHandler } from "./handler.js";
import { containerHandler, itemHandler } from "./handlers/default.js";
import { binarySearch } from "./array.js";

export type NodeBase = {
  tree: NavigationTree;
  id: NodeId;
  connected: boolean;
  parent: NodeId | null;
  depth: number;
  order: number | null;
  focusable: boolean;
  handler: NavigationHandler;
  providers: Map<symbol, unknown | (() => unknown)>;
};

export type NodeChild = { id: NodeId; order: number | null; active: boolean };

export type ContainerNode = NodeBase & {
  type: "container";
  initial: NodeId | null;
  children: NodeChild[];
  rememberChildren: boolean;
};

export type ItemNode = NodeBase & {
  type: "item";
  onSelect: (() => void) | null;
};

export type NavigationNode = ContainerNode | ItemNode;

export type NodeConfig = {
  id: string;
  parent: NodeId;
  focusable?: boolean;
  order?: number;
  handler?: NavigationHandler;
};

export type ItemConfig = NodeConfig & {
  onSelect?: () => void;
};

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
    depth: 0,
    focusable: options.focusable ?? true,
    handler: options.handler ?? itemHandler,
    providers: new Map(),
    onSelect: options.onSelect ?? null,
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
    initial: options.initial ? scopedId(globalId, options.initial) : null,
    order: options.order ?? null,
    depth: 0,
    focusable: options.focusable ?? true,
    handler: options.handler ?? containerHandler,
    providers: new Map(),
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

  if (options.focusable != null) {
    node.focusable = options.focusable;
  }

  if (options.order != null) {
    updateNodeOrder(node, options.order);
  }

  if (node.type === "item" && options.onSelect != null) {
    node.onSelect = options.onSelect;
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
