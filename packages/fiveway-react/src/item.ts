import { type ReactNode, useRef, useEffect } from "react";
import {
  type NodeId,
  type ItemNode,
  createItemNode,
  updateNode,
  connectNode,
  removeNode,
} from "@fiveway/core";
import { useNavigationContext } from "./context.js";
import type { NodeHandle, NodeOptions } from "./node.js";
import {
  useFocus,
  useSelect,
  useRegisterElement,
  useLazyIsFocused,
} from "./hooks.js";

export type ItemHandle = NodeHandle & {
  select: (nodeId?: NodeId, focus?: boolean) => void;
};

export type ItemOptions = NodeOptions & {
  onSelect?: () => void;
};

export function useNavigationItem(options: ItemOptions): ItemHandle {
  const { tree, parentNode } = useNavigationContext();
  const parentId = options.parent ?? parentNode;

  const nodeRef = useRef<ItemNode>(null as unknown as ItemNode);
  if (nodeRef.current === null) {
    nodeRef.current = createItemNode(tree, {
      id: options.id,
      parent: parentId,
      handler: options.handler,
      focusable: options.focusable,
      onSelect: options.onSelect,
      order: options.order,
    });
  } else {
    updateNode(nodeRef.current, options);
  }
  const nodeId = nodeRef.current.id;

  useEffect(() => {
    connectNode(tree, nodeRef.current);

    return () => {
      removeNode(tree, nodeId);
    };
  }, [tree, nodeId]);

  const registerElement = useRegisterElement(nodeRef.current);

  const isFocused = useLazyIsFocused(tree, nodeId);
  const focus = useFocus(nodeId);
  const select = useSelect(nodeId);

  return {
    id: nodeId,
    isFocused,
    focus: (id, options) => focus(id ?? nodeId, options),
    select: (id, focus) => select(id ?? nodeId, focus),
    provide: (provider, value) => provider.provide(nodeRef.current, value),
    registerElement,
  };
}

type ItemProps = ItemOptions & {
  children: ReactNode | ((handle: ItemHandle) => ReactNode);
};

export function NavigationItem({ children, ...props }: ItemProps) {
  const node = useNavigationItem(props);

  return typeof children === "function" ? children(node) : children;
}
