import {
  type Accessor,
  type Component,
  type JSX,
  type ParentProps,
  children,
  createEffect,
  on,
  onCleanup,
  splitProps,
} from "solid-js";
import {
  type FocusOptions,
  type NavigationHandler,
  type NodeId,
  connectNode,
  createNode,
  focusNode,
  isFocused,
  removeNode,
  scopedId,
  selectNode,
  updateNode,
} from "@fiveway/core";
import { useNavigationContext, NavigationContext } from "./context.jsx";
import { createLazyMemo } from "@solid-primitives/memo";

export type NodeOptions = {
  id: NodeId;
  parent?: NodeId;
  order?: number;
  handler?: NavigationHandler;
};

export type NodeHandle = {
  id: NodeId;
  isFocused: Accessor<boolean>;
  focus: (nodeId?: NodeId) => void;
  select: () => void;
  Context: Component<ParentProps>;
};

export function createNavigationNode(options: NodeOptions): NodeHandle {
  const { tree, parentNode, focusedId } = useNavigationContext();

  const node = createNode(tree, {
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
    Context: (props: ParentProps) => (
      <NodeContext node={node.id}>{props.children}</NodeContext>
    ),
  };
}

export type NodeProps = NodeOptions & {
  children?: ((node: Omit<NodeHandle, "Context">) => JSX.Element) | JSX.Element;
};

export function NavigationNode(props: NodeProps) {
  const [, options] = splitProps(props, ["children"]);
  const { Context, ...node } = createNavigationNode(options);

  return (
    <Context>
      {children(() => {
        const child = props.children;

        return typeof child === "function" ? child(node) : child;
      })()}
    </Context>
  );
}

function NodeContext(props: { node: NodeId; children: JSX.Element }) {
  const context = useNavigationContext();

  return (
    <NavigationContext.Provider value={{ ...context, parentNode: props.node }}>
      {props.children}
    </NavigationContext.Provider>
  );
}
