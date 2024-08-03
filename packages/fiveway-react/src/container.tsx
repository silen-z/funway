import { type ReactNode, useRef, useEffect, useCallback } from "react";
import {
  type NodeId,
  type ContainerNode,
  createContainerNode,
  updateNode,
  connectNode,
  removeNode,
} from "@fiveway/core";
import { useNavigationContext, NavigationContext } from "./context.js";
import type { NodeOptions, NodeHandle } from "./node.js";
import { useFocus, useLazyIsFocused, useRegisterElement } from "./hooks.js";

export type ContainerOptions = NodeOptions & {
  initial?: NodeId;
  captureFocus?: boolean;
};

export type ContainerHandle = NodeHandle & {
  Context: React.FunctionComponent<{ children: ReactNode }>;
};

export function useNavigationContainer(
  options: ContainerOptions
): ContainerHandle {
  const { tree, parentNode } = useNavigationContext();
  const parent = options.parent ?? parentNode;

  const nodeRef = useRef<ContainerNode>(null as unknown as ContainerNode);
  if (nodeRef.current === null) {
    nodeRef.current = createContainerNode(tree, {
      id: options.id,
      parent,
      initial: options.initial,
      handler: options.handler,
      focusable: options.focusable,
      captureFocus: options.captureFocus,
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

  const Context: ContainerHandle["Context"] = useCallback(
    (props: { children: ReactNode }) => {
      const context = {
        tree: tree,
        parentNode: nodeId,
      };

      return (
        <NavigationContext.Provider value={context}>
          {props.children}
        </NavigationContext.Provider>
      );
    },
    [tree, nodeId]
  );

  Context.displayName = "NavigationContext";

  const isFocused = useLazyIsFocused(tree, nodeId);
  const focus = useFocus(nodeId);

  return {
    id: nodeId,
    isFocused,
    focus: (id, options) => focus(id ?? nodeId, options),
    provide: (provider, value) => provider.provide(nodeRef.current, value),
    Context,
    registerElement,
  };
}

type ContainerProps = ContainerOptions & {
  children?:
    | ReactNode
    | ((props: Omit<ContainerHandle, "Context">) => ReactNode);
};

export function NavigationContainer({ children, ...props }: ContainerProps) {
  const { Context, ...node } = useNavigationContainer(props);

  return (
    <Context>
      {typeof children === "function" ? children(node) : children}
    </Context>
  );
}
