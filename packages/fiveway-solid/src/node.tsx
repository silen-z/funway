import {
  type Accessor,
  type Component,
  type JSX,
  type ParentProps,
  children,
  createEffect,
  createMemo,
  on,
  onCleanup,
  untrack,
} from "solid-js";
import {
  type FocusOptions,
  type NavigationHandler,
  type NodeId,
  insertNode,
  createNode,
  focusNode,
  removeNode,
  scopedId,
  selectNode,
  updateNode,
  holdFocus,
} from "@fiveway/core";
import { useNavigationContext, NavigationContext } from "./context.jsx";

import { useIsFocused } from "./hooks.js";

export type NodeOptions = {
  id: NodeId | Accessor<NodeId>;
  parent?: NodeId | Accessor<NodeId>;
  order?: number | Accessor<number>;
  handler?: NavigationHandler;
};

export type NodeHandle = {
  (): NodeId;
  focus: (nodeId?: NodeId) => void;
  select: () => void;
  isFocused: Accessor<boolean>;
  Context: Component<ParentProps>;
};

export function createNavigationNode(options: NodeOptions): NodeHandle {
  const { tree, parentNode } = useNavigationContext();

  const parent = createMemo(() => {
    return typeof options.parent === "function"
      ? options.parent()
      : (options.parent ?? parentNode());
  });

  const order = createMemo(() => {
    return typeof options.order === "function"
      ? options.order()
      : options.order;
  });

  const node = createMemo(() => {
    return createNode({
      parent: parent(),
      id: typeof options.id === "function" ? options.id() : options.id,
      handler: options.handler,
      order: untrack(order),
    });
  });

  const updatable = () => ({
    handler: options.handler,
    order: order(),
  });

  createEffect(() => {
    // to resolve initial focus correctly focus need to be held while child nodes get inserted via effects
    // child effects should run synchronously after this one
    // and Promise.resolve() should release the focus when they are done
    const releaseFocus = holdFocus(tree);
    if (releaseFocus) {
      Promise.resolve().then(releaseFocus);
    }

    const n = node();
    insertNode(tree, n);

    // prettier-ignore
    createEffect(on(updatable, (options) => {
      updateNode(n, options);
    }, { defer: true }));

    onCleanup(() => {
      removeNode(tree, n.id);
    });
  });

  const focus = (nodeId?: NodeId, options?: FocusOptions) => {
    const id = nodeId != null ? scopedId(node().id, nodeId) : node().id;
    return focusNode(tree, id, options);
  };

  const select = (nodeId?: NodeId) => {
    const id = nodeId != null ? scopedId(node().id, nodeId) : node().id;
    selectNode(tree, id);
  };

  const handle = () => node().id;
  handle.focus = focus;
  handle.select = select;
  handle.isFocused = useIsFocused(() => node().id);
  handle.Context = (props: ParentProps) => {
    const value = { tree, parentNode: () => node().id };

    return (
      <NavigationContext.Provider value={value}>
        {props.children}
      </NavigationContext.Provider>
    );
  };

  return handle;
}

export type NodeProps = NodeOptions & {
  children?: ((node: NodeHandle) => JSX.Element) | JSX.Element;
};

export function NavigationNode(props: NodeProps) {
  const context = useNavigationContext();
  const node = createNavigationNode(props);

  return (
    <NavigationContext.Provider
      value={{ ...context, parentNode: () => node() }}
    >
      {children(() => {
        const child = props.children;

        return typeof child === "function" ? child(node) : child;
      })()}
    </NavigationContext.Provider>
  );
}
