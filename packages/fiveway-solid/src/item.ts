import {
  type JSX,
  createEffect,
  onCleanup,
  on,
  splitProps,
  children,
} from "solid-js";
import { createLazyMemo } from "@solid-primitives/memo";
import {
  type NodeId,
  type FocusOptions,
  createItemNode,
  connectNode,
  updateNode,
  removeNode,
  isFocused,
  focusNode,
  scopedId,
  selectNode,
} from "@fiveway/core";
import { useNavigationContext } from "./context.jsx";
import type { NodeHandle, NodeOptions } from "./node.jsx";

export type ItemHandle = NodeHandle & {
  select: () => void;
};

export function createNavigationItem(options: NodeOptions): ItemHandle {
  const { tree, parentNode, focusedId } = useNavigationContext();

  const node = createItemNode(tree, {
    id: options.id,
    parent: options.parent ?? parentNode,
    order: options.order,
    handler: options.handler,
  });

  createEffect(() => {
    connectNode(tree, node);

    createEffect(() => {
      updateNode(node, options);
    });

    onCleanup(() => {
      removeNode(tree, node.id);
    });
  });

  return {
    id: node.id,
    isFocused: createLazyMemo(on(focusedId, () => isFocused(tree, node.id))),
    focus: (nodeId?: NodeId, options?: FocusOptions) => {
      return focusNode(
        tree,
        nodeId != null ? scopedId(parentNode, nodeId) : node.id,
        options
      );
    },
    select: (nodeId?: NodeId) => {
      selectNode(tree, nodeId != null ? scopedId(parentNode, nodeId) : node.id);
    },
  };
}

export type ItemProps = NodeOptions & {
  children: JSX.Element | ((node: ItemHandle) => JSX.Element);
};

export function NavigationItem(props: ItemProps) {
  const [, options] = splitProps(props, ["children"]);
  const node = createNavigationItem(options);

  return children(() => {
    const child = props.children;

    return typeof child === "function" ? child(node) : child;
  })();
}
