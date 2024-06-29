import {
  type MutableRefObject,
  type ReactNode,
  createElement,
  useCallback,
  useEffect,
  useSyncExternalStore,
  useRef,
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
  hasFocusWithin,
  requestFocus,
  createProvider,
  updateNode,
  registerFocusListener,
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

export type NavigationItemHandle = {
  nodeId: NodeId;
  provide: <T>(
    provider: Provider<T>,
    value: Parameters<Provider<T>["provide"]>[1]
  ) => void;
};

export function useNavigationItem(
  options: NavigationItemOptions
): NavigationItem {
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

  return nodeRef.current;
}

export type NavigationContainerOptions = NavigationNodeOptions & {
  initial?: NodeId;
  captureFocus?: boolean;
};

export type NavigationContainerHandle = {
  node: NavigationContainer;
  NavContext: React.FunctionComponent<{ children: ReactNode }>;
};

export function useNavigationContainer(
  options: NavigationContainerOptions
): NavigationContainerHandle {
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

  const NavContext = useCallback(
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

  return { node: nodeRef.current, NavContext };
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
    (callback: () => void) => registerFocusListener(tree, callback),
    [tree]
  );

  return useSyncExternalStore(subscribe, () => tree.focusedId === globalId);
}

export function useHasFocusWithin(nodeId: NodeId) {
  const { tree, parentNode } = useNavigationContext();
  const globalId = scopedId(parentNode, nodeId);

  const subscribe = useCallback(
    (callback: () => void) => registerFocusListener(tree, callback),
    [tree]
  );

  return useSyncExternalStore(subscribe, () => hasFocusWithin(tree, globalId));
}

export function useNavigationActions(scope?: NodeId) {
  const { tree, parentNode } = useNavigationContext();
  const parentId = scope ?? parentNode;

  const focus = useCallback(
    (nodeId: NodeId, options?: FocusOptions) => {
      requestFocus(tree, scopedId(parentId, nodeId), options);
    },
    [tree, parentId]
  );

  const select = useCallback(
    (nodeId: NodeId, focus?: boolean) => {
      selectNode(tree, scopedId(parentId, nodeId), focus);
    },
    [tree, parentId]
  );

  return { focus, select };
}
