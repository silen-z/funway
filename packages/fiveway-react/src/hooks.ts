import { useCallback, useEffect, useSyncExternalStore, useRef } from "react";
import {
  type NodeId,
  type FocusOptions,
  selectNode,
  isFocused,
  registerListener,
  focusNode,
  scopedId,
} from "@fiveway/core";
import { useNavigationContext } from "./context.js";

export function useIsFocused(nodeId: NodeId) {
  const { tree, parentNode } = useNavigationContext();
  const globalId = scopedId(parentNode, nodeId);

  const subscribe = useCallback(
    (cb: () => void) => registerListener(tree, globalId, "focuschange", cb),
    [tree, globalId],
  );

  return useSyncExternalStore(subscribe, () => isFocused(tree, globalId));
}

export function useOnFocus(
  nodeId: NodeId,
  handler: (id: NodeId | null) => void,
) {
  const { tree, parentNode } = useNavigationContext();
  const globalId = scopedId(parentNode, nodeId);

  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    return registerListener(tree, globalId, "focuschange", (e) => {
      const id = isFocused(tree, globalId) ? e.focused : null;
      handlerRef.current(id);
    });
  }, [globalId]);
}

export function useFocusedId(scope: NodeId) {
  const { tree, parentNode } = useNavigationContext();
  const globalId = scopedId(parentNode, scope);

  const subscribe = useCallback(
    (cb: () => void) => registerListener(tree, globalId, "focuschange", cb),
    [tree, globalId],
  );

  return useSyncExternalStore(subscribe, () =>
    isFocused(tree, globalId) ? tree.focusedId : null,
  );
}

export function useFocus(
  scope?: NodeId,
): (nodeId: NodeId, options?: FocusOptions) => boolean {
  const { tree, parentNode } = useNavigationContext();
  scope ??= parentNode;

  return useCallback(
    (nodeId: NodeId, options?: FocusOptions) => {
      return focusNode(tree, scopedId(scope, nodeId), options);
    },
    [tree, scope],
  );
}

export function useSelect(scope?: NodeId) {
  const { tree, parentNode } = useNavigationContext();
  scope ??= parentNode;

  return useCallback(
    (nodeId: NodeId, focus?: boolean) => {
      selectNode(tree, scopedId(scope, nodeId), focus);
    },
    [tree, scope],
  );
}
