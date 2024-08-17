import {
  type Component,
  type ParentProps,
  createEffect,
  onCleanup,
  on,
  splitProps,
  children,
  type JSX,
} from "solid-js";
import { createLazyMemo } from "@solid-primitives/memo";
import {
  type NodeId,
  createContainerNode,
  connectNode,
  updateNode,
  removeNode,
  PositionProvider,
  isFocused,
  focusNode,
  scopedId,
  type FocusOptions,
} from "@fiveway/core";
import { ElementProvider } from "./hooks.jsx";
import { useNavigationContext } from "./context.js";
import { NodeContext, type NodeHandle, type NodeOptions } from "./node.jsx";

export type ContainerHandle = NodeHandle & {
  Context: Component<ParentProps>;
};

export function createNavigationContainer(
  options: NodeOptions
): ContainerHandle {
  const { tree, parentNode, focusedId } = useNavigationContext();

  const node = createContainerNode(tree, {
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
    provide: (provider, value) => {
      createEffect(() => {
        provider.provide(node, value());
      });
    },
    registerElement,
    Context: (props: ParentProps) => (
      <NodeContext node={node.id}>{props.children}</NodeContext>
    ),
  };
}

export type ContainerProps = NodeOptions & {
  children?:
    | ((node: Omit<ContainerHandle, "Context">) => JSX.Element)
    | JSX.Element;
};

export function NavigationContainer(props: ContainerProps) {
  const [, options] = splitProps(props, ["children"]);
  const { Context, ...node } = createNavigationContainer(options);

  return (
    <Context>
      {children(() => {
        const child = props.children;

        return typeof child === "function" ? child(node) : child;
      })()}
    </Context>
  );
}
