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
  PositionProvider,
  isFocused,
  focusNode,
  scopedId,
  selectNode,
} from "@fiveway/core";
import { useNavigationContext } from "./context.js";
import { ElementProvider } from "./hooks.jsx";
import type { NodeHandle, NodeOptions } from "./node.jsx";

export type ItemOptions = NodeOptions & {
  onSelect?: () => void;
};

export type ItemHandle = NodeHandle & {
  select: () => void;
};

export function createNavigationItem(options: ItemOptions): ItemHandle {
  const { tree, parentNode, focusedId } = useNavigationContext();

  const node = createItemNode(tree, {
    id: options.id,
    parent: options.parent ?? parentNode,
    order: options.order,
    onSelect: options.onSelect,
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

  const registerElement = (el: HTMLElement) => {
    ElementProvider.provide(node, el);

    PositionProvider.provide(node, () => {
      return el.getBoundingClientRect();
    });
  };

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
    registerElement,
    provide: (provider, value) => {
      provider.provide(node, value);
    },
  };
}

export type ItemProps = ItemOptions & {
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
