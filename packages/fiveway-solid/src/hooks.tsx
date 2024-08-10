import { type Accessor, createEffect, createSignal, onCleanup } from "solid-js";
import {
  type NodeId,
  type FocusOptions,
  selectNode,
  createProvider,
  scopedId,
  focusNode,
  isFocused,
  registerListener,
} from "@fiveway/core";
import { useNavigationContext } from "./context.js";

export const ElementProvider = createProvider<HTMLElement>("element");

export function useIsFocused(nodeId: NodeId): Accessor<boolean> {
  const { tree, parentNode } = useNavigationContext();
  const globalId = scopedId(parentNode, nodeId);

  const [isNodeFocused, setFocused] = createSignal(isFocused(tree, globalId));

  createEffect(() => {
    const cleanup = registerListener(tree, {
      type: "focuschange",
      node: globalId,
      fn: () => setFocused(isFocused(tree, globalId)),
    });

    onCleanup(() => {
      cleanup();
    });
  });

  return isNodeFocused;
}

export function useOnFocus(
  nodeId: NodeId,
  handler: (id: NodeId | null) => void
) {
  const { tree, parentNode } = useNavigationContext();
  const globalId = scopedId(parentNode, nodeId);

  createEffect(() => {
    const cleanup = registerListener(tree, {
      type: "focuschange",
      node: globalId,
      fn: () => {
        const id = isFocused(tree, globalId) ? tree.focusedId : null;
        handler(id);
      },
    });

    onCleanup(() => {
      cleanup();
    });
  });
}

export function useFocusedId(scope: NodeId) {
  const { tree, parentNode } = useNavigationContext();
  const globalId = scopedId(parentNode, scope);
  const [focusedId, setFocusedId] = createSignal(
    isFocused(tree, globalId) ? tree.focusedId : null
  );

  createEffect(() => {
    const cleanup = registerListener(tree, {
      type: "focuschange",
      node: globalId,
      fn: () => {
        const id = isFocused(tree, globalId) ? tree.focusedId : null;
        setFocusedId(id);
      },
    });

    onCleanup(() => {
      cleanup();
    });
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
