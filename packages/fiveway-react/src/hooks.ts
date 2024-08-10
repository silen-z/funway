import {
  useCallback,
  useEffect,
  useSyncExternalStore,
  useRef,
  useState,
} from "react";
import {
  type NodeId,
  type FocusOptions,
  selectNode,
  isFocused,
  registerListener,
  focusNode,
  scopedId,
  createProvider,
  type NavigationNode,
  type NavigationTree,
  PositionProvider,
} from "@fiveway/core";
import { useNavigationContext } from "./context.js";

export function useIsFocused(nodeId: NodeId) {
  const { tree, parentNode } = useNavigationContext();
  const globalId = scopedId(parentNode, nodeId);

  const subscribe = useCallback(
    (callback: () => void) =>
      registerListener(tree, {
        type: "focuschange",
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
    return registerListener(tree, {
      type: "focuschange",
      node: globalId,
      fn: () => {
        const id = isFocused(tree, globalId) ? tree.focusedId : null;
        handlerRef.current(id);
      },
    });
  }, [globalId]);
}

export function useFocusedId(scope: NodeId) {
  const { tree, parentNode } = useNavigationContext();
  const globalId = scopedId(parentNode, scope);

  const subscribe = useCallback(
    (callback: () => void) =>
      registerListener(tree, {
        type: "focuschange",
        node: globalId,
        fn: callback,
      }),
    [tree, globalId]
  );

  return useSyncExternalStore(subscribe, () =>
    isFocused(tree, globalId) ? tree.focusedId : null
  );
}

export function useFocus(
  scope?: NodeId
): (nodeId: NodeId, options?: FocusOptions) => boolean {
  const { tree, parentNode } = useNavigationContext();
  scope ??= parentNode;

  return useCallback(
    (nodeId: NodeId, options?: FocusOptions) => {
      return focusNode(tree, scopedId(scope, nodeId), options);
    },
    [tree, scope]
  );
}

export function useSelect(scope?: NodeId) {
  const { tree, parentNode } = useNavigationContext();
  scope ??= parentNode;

  return useCallback(
    (nodeId: NodeId, focus?: boolean) => {
      selectNode(tree, scopedId(scope, nodeId), focus);
    },
    [tree, scope]
  );
}

export const ElementProvider = createProvider<HTMLElement>("element");

/**
 * @internal
 */
export function useRegisterElement(node: NavigationNode) {
  return useCallback((element: HTMLElement | null) => {
    ElementProvider.provide(node, element ?? null);

    PositionProvider.provide(node, () => {
      return element?.getBoundingClientRect() ?? null;
    });
  }, []);
}

const noopSubscribe = () => () => {};

/**
 * @internal
 */
export function useLazyIsFocused(tree: NavigationTree, nodeId: NodeId) {
  const [subscribed, setSubscribed] = useState(false);

  const subscribe = useCallback(
    (callback: () => void) =>
      registerListener(tree, {
        type: "focuschange",
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
