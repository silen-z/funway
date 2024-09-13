import {
  type Accessor,
  createEffect,
  createMemo,
  createSignal,
  onCleanup,
} from "solid-js";
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

export function useIsFocused(
  nodeId: NodeId | Accessor<NodeId>,
): Accessor<boolean> {
  const { tree, parentNode } = useNavigationContext();
  const globalId = createMemo(() => {
    const id = typeof nodeId === "function" ? nodeId() : nodeId;
    return scopedId(parentNode(), id);
  });

  const [isNodeFocused, setFocused] = createSignal<boolean | null>(null);

  let subscription: (() => void) | null = null;
  const subscribe = (id: NodeId) =>
    registerListener(tree, id, "focuschange", () => {
      setFocused(isFocused(tree, id));
    });

  createEffect(() => {
    const id = globalId();

    if (subscription !== null) {
      subscription();
      subscription = subscribe(id);
    }
  });

  onCleanup(() => {
    subscription?.();
  });

  const getter = () => {
    const id = globalId();

    if (subscription === null) {
      subscription = subscribe(id);
    }

    return isNodeFocused() ?? isFocused(tree, id);
  };

  return getter;
}

export function useOnFocus(
  nodeId: NodeId,
  handler: (id: NodeId | null) => void,
) {
  const { tree, parentNode } = useNavigationContext();
  const globalId = scopedId(parentNode(), nodeId);

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
  const globalId = scopedId(parentNode(), scope);
  const [focusedId, setFocusedId] = createSignal(
    isFocused(tree, globalId) ? tree.focusedId : null,
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
  scope ??= parentNode();

  return (nodeId: NodeId, options?: FocusOptions) => {
    return focusNode(tree, scopedId(scope, nodeId), options);
  };
}

export function useSelect(scope?: NodeId) {
  const { tree, parentNode } = useNavigationContext();
  scope ??= parentNode();

  return (nodeId: NodeId, focus?: boolean) => {
    selectNode(tree, scopedId(scope, nodeId), focus);
  };
}
