import { type Accessor, createEffect, createSignal, onCleanup } from "solid-js";
import {
  type NodeId,
  type FocusOptions,
  selectNode,
  scopedId,
  focusNode,
  isFocused,
  registerListener,
} from "@fiveway/core";
import { useNavigationContext } from "./context.jsx";

export function useIsFocused(nodeId: NodeId): Accessor<boolean> {
  const { tree, parentNode } = useNavigationContext();
  const globalId = scopedId(parentNode, nodeId);

  const [isNodeFocused, setFocused] = createSignal(false);
  const [subscription, setSubscription] = createSignal<(() => void) | null>(
    null
  );

  onCleanup(() => {
    subscription()?.();
  });

  const getIsFocused = () => {
    if (subscription() === null) {
      const cleanup = registerListener(tree, globalId, "focuschange", () =>
        setFocused(isFocused(tree, globalId))
      );

      setSubscription(() => cleanup);

      return isFocused(tree, globalId);
    }

    return isNodeFocused();
  };

  return getIsFocused;
}

export function useOnFocus(
  nodeId: NodeId,
  handler: (id: NodeId | null) => void
) {
  const { tree, parentNode } = useNavigationContext();
  const globalId = scopedId(parentNode, nodeId);

  createEffect(() => {
    const cleanup = registerListener(tree, globalId, "focuschange", () => {
      const id = isFocused(tree, globalId) ? tree.focusedId : null;
      handler(id);
    });

    onCleanup(cleanup);
  });
}

export function useFocusedId(scope: NodeId) {
  const { tree, parentNode } = useNavigationContext();
  const globalId = scopedId(parentNode, scope);
  const [focusedId, setFocusedId] = createSignal(
    isFocused(tree, globalId) ? tree.focusedId : null
  );

  createEffect(() => {
    const cleanup = registerListener(tree, globalId, "focuschange", () => {
      const id = isFocused(tree, globalId) ? tree.focusedId : null;
      setFocusedId(id);
    });

    onCleanup(cleanup);
  });

  return focusedId;
}

export function useFocus(scope?: NodeId) {
  const { tree, parentNode } = useNavigationContext();
  scope ??= parentNode;

  return (nodeId: NodeId, options?: FocusOptions) => {
    return focusNode(tree, scopedId(scope, nodeId), options);
  };
}

export function useSelect(scope?: NodeId) {
  const { tree, parentNode } = useNavigationContext();
  scope ??= parentNode;

  return (nodeId: NodeId, focus?: boolean) => {
    selectNode(tree, scopedId(scope, nodeId), focus);
  };
}
