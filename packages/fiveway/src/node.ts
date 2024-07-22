import {
  type NavigationTree,
  createGlobalId,
  getContainerNode,
  scopedId,
} from "./tree.js";
import type { NavigationHandler } from "./handlers/types.js";
import { containerHandler, itemHandler } from "./handlers/default.js";

import { binarySearch } from "./array.js";

export type NodeId = string;

type NavigationNodeBase = {
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

export type NavigationContainer = NavigationNodeBase & {
  type: "container";
  initial: NodeId | null;
  children: NodeChild[];
  captureFocus: boolean;
};

export type NavigationItem = NavigationNodeBase & {
  type: "item";
  onSelect: (() => void) | null;
};

export type NavigationNode = NavigationContainer | NavigationItem;

export type NodeConfig = {
  id: string;
  parent: NodeId;
  focusable?: boolean;
  order?: number;
  handler?: NavigationHandler;
};

export type ItemNodeConfig = NodeConfig & {
  onSelect?: () => void;
};

export function createItemNode(
  tree: NavigationTree,
  options: ItemNodeConfig
): NavigationItem {
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

export type ContainerNodeConfig = NodeConfig & {
  initial?: NodeId;
  captureFocus?: boolean;
};

export function createContainerNode(
  tree: NavigationTree,
  options: ContainerNodeConfig
): NavigationContainer {
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
    captureFocus: options.captureFocus ?? false,
  };
}

export function updateNode(
  node: NavigationItem,
  config: Omit<ItemNodeConfig, "id" | "parent">
): void;
export function updateNode(
  node: NavigationContainer,
  config: Omit<ContainerNodeConfig, "id" | "parent">
): void;
export function updateNode<N extends NavigationNode>(
  node: N,
  options: Omit<ItemNodeConfig & ContainerNodeConfig, "id" | "parent">
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

  if (node.type === "container" && options.captureFocus != null) {
    node.captureFocus = options.captureFocus;
  }
}

function updateNodeOrder(node: NavigationNode, order: number) {
  if (node.order !== order && node.parent !== null) {
    node.order = order;

    // update children inside parent
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
