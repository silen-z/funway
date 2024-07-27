import {
  type Accessor,
  type Component,
  type ParentProps,
  onCleanup,
  createMemo,
  createEffect,
  on,
} from "solid-js";
import {
  type NodeId,
  type FocusOptions,
  type NavigationHandler,
  type Provider,
  createItemNode,
  createContainerNode,
  connectNode,
  selectNode,
  removeNode,
  createProvider,
  updateNode,
  scopedId,
  focusNode,
  isFocused,
  PositionProvider,
} from "@fiveway/core";
import { useNavigationContext } from "./context.js";
import { NodeContext } from "./NavigationNode.jsx";
import { createLazyMemo } from "@solid-primitives/memo";

export const ElementProvider = createProvider<HTMLElement>("element");

export type NavigationNodeOptions = {
  id: NodeId;
  parent?: NodeId;
  focusable?: boolean;
  order?: number;
  onFocus?: () => void;
  handler?: NavigationHandler;
};

export type NavigationItemOptions = NavigationNodeOptions & {
  onSelect?: () => void;
};

type NodeHandle = {
  id: NodeId;
  isFocused: Accessor<boolean>;
  focus: (nodeId?: NodeId) => void;
  provide: <P extends Provider<unknown>>(
    provider: P,
    value: P extends Provider<infer V> ? Accessor<V> : never
  ) => void;
  registerElement: (el: HTMLElement | Accessor<HTMLElement>) => void;
};

export type ItemHandle = NodeHandle & {
  select: () => void;
};

export function createNavigationItem(
  getOptions: NavigationItemOptions | Accessor<NavigationItemOptions>
): ItemHandle {
  const { tree, parentNode, focusedId } = useNavigationContext();

  const initialOptions = access(getOptions);

  const node = createItemNode(tree, {
    id: initialOptions.id,
    parent: initialOptions.parent ?? parentNode,
    order: initialOptions.order,
    onSelect: initialOptions.onSelect,
    focusable: initialOptions.focusable,
    handler: initialOptions.handler,
  });

  createEffect(() => {
    connectNode(tree, node);

    createEffect(() => {
      const currentOptions = access(getOptions);

      updateNode(node, currentOptions);
    });

    onCleanup(() => {
      removeNode(tree, node.id);
    });
  });

  const registerElement = (el: HTMLElement | Accessor<HTMLElement>) => {
    ElementProvider.provide(node, () => {
      return access(el) ?? null;
    });

    PositionProvider.provide(node, () => {
      return access(el).getBoundingClientRect() ?? null;
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

export type NavigationContainerOptions = NavigationNodeOptions & {
  initial?: NodeId;
  captureFocus?: boolean;
};

export type ContainerHandle = NodeHandle & {
  Context: Component<ParentProps>;
};

export function createNavigationContainer(
  getOptions: NavigationContainerOptions | Accessor<NavigationContainerOptions>
): ContainerHandle {
  const { tree, parentNode, focusedId } = useNavigationContext();

  const initialOptions = access(getOptions);

  const node = createContainerNode(tree, {
    id: initialOptions.id,
    parent: initialOptions.parent ?? parentNode,
    initial: initialOptions.initial,
    order: initialOptions.order,
    captureFocus: initialOptions.captureFocus,
    focusable: initialOptions.focusable,
    handler: initialOptions.handler,
  });

  createEffect(() => {
    connectNode(tree, node);

    createEffect(() => {
      updateNode(node, access(getOptions));
    });

    onCleanup(() => {
      removeNode(tree, node.id);
    });
  });

  const registerElement = (el: HTMLElement | Accessor<HTMLElement>) => {
    ElementProvider.provide(node, () => {
      return access(el) ?? null;
    });

    PositionProvider.provide(node, () => {
      return access(el).getBoundingClientRect() ?? null;
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

export function useIsFocused(nodeId: NodeId): Accessor<boolean> {
  const { tree, focusedId, parentNode } = useNavigationContext();

  const getIsFocused = createMemo(
    on(focusedId, () => {
      const globalId = scopedId(parentNode, nodeId);
      return isFocused(tree, globalId);
    })
  );

  return getIsFocused;
}

export function useNavigationActions() {
  const { tree, parentNode } = useNavigationContext();

  const focus = (nodeId: NodeId, options?: FocusOptions) => {
    return focusNode(tree, scopedId(parentNode, nodeId), options);
  };

  const select = (nodeId: NodeId, focus?: boolean) => {
    selectNode(tree, scopedId(parentNode, nodeId), focus);
  };

  return { focus, select };
}

function access<T extends Accessor<unknown> | unknown>(
  v: T
): T extends () => unknown ? ReturnType<T> : T {
  return typeof v === "function" && !v.length ? v() : v;
}
