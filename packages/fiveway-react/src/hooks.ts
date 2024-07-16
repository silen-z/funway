import {
  type MutableRefObject,
  type ReactNode,
  createElement,
  useCallback,
  useEffect,
  useSyncExternalStore,
  useRef,
  useState,
} from "react";
import {
  type NodeId,
  type NavigationItem,
  type NavigationContainer,
  type FocusOptions,
  type NavigationHandler,
  type Provider,
  selectNode,
  createGlobalId,
  createItemNode,
  createContainerNode,
  connectNode,
  removeNode,
  isFocused,
  createProvider,
  updateNode,
  registerFocusListener,
  type NavigationTree,
  focusNode,
} from "@fiveway/core";
import { PositionProvider } from "@fiveway/core/dom";
import { useNavigationContext, NavigationContext } from "./context.js";

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
  elRef?: MutableRefObject<HTMLElement | null>;
  onSelect?: () => void;
};

type NodeHandle = {
  id: NodeId;
  isFocused: () => boolean;
  focus: (nodeId?: NodeId) => void;
  provide: <P extends Provider<unknown>>(
    provider: P,
    value: P extends Provider<infer V> ? V : never
  ) => void;
};

export type ItemHandle = NodeHandle & {
  select: () => void;
};

export function useNavigationItem(options: NavigationItemOptions): ItemHandle {
  const { tree, parentNode } = useNavigationContext();

  const parentId = options.parent ?? parentNode;
  const nodeId = createGlobalId(parentId, options.id);

  const nodeRef = useRef<NavigationItem | null>(null);

  if (nodeRef.current === null) {
    nodeRef.current = createItemNode(tree, {
      id: options.id,
      parent: parentId,
      handler: options.handler,
      focusable: options.focusable,
      onSelect: options.onSelect,
    }) as NavigationItem;
  } else {
    updateNode(nodeRef.current, options);
  }

  ElementProvider.provide(nodeRef.current, () => {
    return options.elRef?.current ?? null;
  });

  PositionProvider.provide(nodeRef.current, () => {
    return options.elRef?.current?.getBoundingClientRect() ?? null;
  });

  useEffect(() => {
    connectNode(tree, nodeRef.current!);

    return () => {
      removeNode(tree, nodeId);
    };
  }, [tree, nodeId]);

  const isFocused = useLazyIsFocused(tree, nodeId);
  const { focus, select } = useNavigationActions();

  return {
    id: nodeId,
    isFocused,
    focus: () => focus(nodeId),
    select: () => select(nodeId),
    provide: (provider, value) => provider.provide(nodeRef.current!, value),
  };
}

export type NavigationContainerOptions = NavigationNodeOptions & {
  initial?: NodeId;
  captureFocus?: boolean;
};

export type ContainerHandle = NodeHandle & {
  Context: React.FunctionComponent<{ children: ReactNode }>;
};

export function useNavigationContainer(
  options: NavigationContainerOptions
): ContainerHandle {
  const { tree, parentNode } = useNavigationContext();

  const parent = options.parent ?? parentNode;

  const nodeRef = useRef<NavigationContainer | null>(null);

  if (nodeRef.current === null) {
    nodeRef.current = createContainerNode(tree, {
      id: options.id,
      parent,
      initial: options.initial,
      handler: options.handler,
      focusable: options.focusable,
      captureFocus: options.captureFocus,
      order: options.order,
    }) as NavigationContainer;
  } else {
    updateNode(nodeRef.current, options);
  }

  const nodeId = nodeRef.current.id;

  useEffect(() => {
    connectNode(tree, nodeRef.current!);

    return () => {
      removeNode(tree, nodeId);
    };
  }, [tree, nodeId]);

  const Context = useCallback(
    (props: { children: ReactNode }) => {
      const context = {
        tree: tree,
        parentNode: nodeId,
      };

      return createElement(
        NavigationContext.Provider,
        { value: context },
        props.children
      );
    },
    [tree, nodeId]
  );

  const isFocused = useLazyIsFocused(tree, nodeId);
  const { focus } = useNavigationActions();

  return {
    id: nodeId,
    isFocused,
    focus: () => focus(nodeId),
    provide: (provider, value) => provider.provide(nodeRef.current!, value),
    Context,
  };
}

function scopedId(scope: NodeId, nodeId: NodeId) {
  if (nodeId.startsWith("#")) {
    return nodeId;
  }

  return createGlobalId(scope, nodeId);
}

export function useIsFocused(nodeId: NodeId) {
  const { tree, parentNode } = useNavigationContext();
  const globalId = scopedId(parentNode, nodeId);

  const subscribe = useCallback(
    (callback: () => void) =>
      registerFocusListener(tree, {
        type: "focuschange" as const,
        node: nodeId,
        fn: callback,
      }),
    [tree, nodeId]
  );

  return useSyncExternalStore(subscribe, () => isFocused(tree, globalId));
}

export function useNavigationActions() {
  const { tree, parentNode } = useNavigationContext();

  const focus = useCallback(
    (nodeId: NodeId, options?: FocusOptions) => {
      return focusNode(tree, scopedId(parentNode, nodeId), options);
    },
    [tree, parentNode]
  );

  const select = useCallback(
    (nodeId: NodeId, focus?: boolean) => {
      selectNode(tree, scopedId(parentNode, nodeId), focus);
    },
    [tree, parentNode]
  );

  return { focus, select };
}

const noopSubscribe = () => () => {};
function useLazyIsFocused<V>(tree: NavigationTree, nodeId: NodeId) {
  const [subscribed, setSubscribed] = useState(false);

  const subscribe = useCallback(
    (callback: () => void) =>
      registerFocusListener(tree, {
        type: "focuschange" as const,
        node: nodeId,
        fn: callback,
      }),
    [tree, nodeId]
  );

  const subscribedValue = useSyncExternalStore(
    subscribed ? subscribe : noopSubscribe,
    () => isFocused(tree, nodeId)
  );

  return () => {
    if (!subscribed) {
      setSubscribed(true);
    }

    return subscribedValue;
  };
}
