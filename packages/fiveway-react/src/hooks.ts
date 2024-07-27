import {
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
  type ItemNode,
  type ContainerNode,
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
  PositionProvider,
  type NavigationNode,
  scopedId,
} from "@fiveway/core";
import { useNavigationContext, NavigationContext } from "./context.js";

export const ElementProvider = createProvider<HTMLElement>("element");

export type NavigationNodeOptions = {
  id: NodeId;
  parent?: NodeId;
  focusable?: boolean;
  order?: number;
  handler?: NavigationHandler;
};

export type NavigationItemOptions = NavigationNodeOptions & {
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
  registerElement: (element: HTMLElement | null) => void;
};

export type ItemHandle = NodeHandle & {
  select: () => void;
};

export function useNavigationItem(options: NavigationItemOptions): ItemHandle {
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
  const { focus, select } = useNavigationActions();

  return {
    id: nodeId,
    isFocused,
    focus: () => focus(nodeId),
    select: () => select(nodeId),
    provide: (provider, value) => provider.provide(nodeRef.current, value),
    registerElement,
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
    provide: (provider, value) => provider.provide(nodeRef.current, value),
    Context,
    registerElement,
  };
}

export function useIsFocused(nodeId: NodeId) {
  const { tree, parentNode } = useNavigationContext();
  const globalId = scopedId(parentNode, nodeId);

  const subscribe = useCallback(
    (callback: () => void) =>
      registerFocusListener(tree, {
        type: "focuschange" as const,
        node: globalId,
        fn: callback,
      }),
    [tree, globalId]
  );

  return useSyncExternalStore(subscribe, () => isFocused(tree, globalId));
}

export function useOnFocus(
  nodeId: NodeId,
  handler: (id: NodeId | null) => void
) {
  const { tree, parentNode } = useNavigationContext();
  const globalId = scopedId(parentNode, nodeId);

  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    return registerFocusListener(tree, {
      type: "focuschange" as const,
      node: globalId,
      fn: () => {
        return handlerRef.current(
          isFocused(tree, globalId) ? tree.focusedId : null
        );
      },
    });
  }, [globalId]);
}

export function useFocusedId(scope: NodeId) {
  const { tree, parentNode } = useNavigationContext();
  const globalId = scopedId(parentNode, scope);

  const subscribe = useCallback(
    (callback: () => void) =>
      registerFocusListener(tree, {
        type: "focuschange" as const,
        node: globalId,
        fn: callback,
      }),
    [tree, globalId]
  );

  return useSyncExternalStore(subscribe, () =>
    isFocused(tree, globalId) ? tree.focusedId : null
  );
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
function useLazyIsFocused(tree: NavigationTree, nodeId: NodeId) {
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

function useRegisterElement(node: NavigationNode) {
  return useCallback((element: HTMLElement | null) => {
    ElementProvider.provide(node, element ?? null);

    PositionProvider.provide(node, () => {
      return element?.getBoundingClientRect() ?? null;
    });
  }, []);
}
