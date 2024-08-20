import type {
  NodeId,
  NavigationHandler,
  FocusOptions,
  NavigationNode,
} from "@fiveway/core";
import { type ReactNode, useRef, useEffect, useCallback } from "react";
import { updateNode, connectNode, removeNode, createNode } from "@fiveway/core";
import { NavigationContext, useNavigationContext } from "./context.js";
import { useFocus, useSelect } from "./hooks.js";
import { useLazyIsFocused } from "./internal.js";

export type NodeOptions = {
  id: NodeId;
  parent?: NodeId;
  order?: number;
  handler?: NavigationHandler;
};

export type NodeHandle = {
  id: NodeId;
  isFocused: () => boolean;
  focus: (nodeId?: NodeId, options?: FocusOptions) => void;
  select: (nodeId?: NodeId, focus?: boolean) => void;
  Context: React.FunctionComponent<{ children: ReactNode }>;
};

export function useNavigationNode(options: NodeOptions): NodeHandle {
  const { tree, parentNode } = useNavigationContext();
  const parent = options.parent ?? parentNode;

  const nodeRef = useRef<NavigationNode>(null as unknown as NavigationNode);
  if (nodeRef.current === null) {
    nodeRef.current = createNode(tree, {
      id: options.id,
      parent,
      handler: options.handler,
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

  const Context: NodeHandle["Context"] = useCallback(
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

  Context.displayName = "NodeContext";

  const isFocused = useLazyIsFocused(tree, nodeId);
  const focus = useFocus(nodeId);
  const select = useSelect(nodeId);

  return {
    id: nodeId,
    isFocused,
    focus: (id, options) => focus(id ?? nodeId, options),
    select: (id, focus) => select(id ?? nodeId, focus),
    Context,
  };
}

export type NodeProps = NodeOptions & {
  children?: ReactNode | ((props: Omit<NodeHandle, "Context">) => ReactNode);
};

export function NavigationNode({ children, ...props }: NodeProps) {
  const { Context, ...node } = useNavigationNode(props);

  return (
    <Context>
      {typeof children === "function" ? children(node) : children}
    </Context>
  );
}
