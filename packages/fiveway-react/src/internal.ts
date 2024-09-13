import { useCallback, useSyncExternalStore, useRef } from "react";
import {
  type NavigationTree,
  type NodeId,
  registerListener,
  isFocused,
} from "@fiveway/core";

function noopSubscribe() {
  return () => {};
}

/**
 * @internal
 */
export function useLazyIsFocused(tree: NavigationTree, nodeId: NodeId) {
  const subscribe = useCallback(
    (cb: () => void) => registerListener(tree, nodeId, "focuschange", cb),
    [tree, nodeId],
  );

  const subscription = useRef<typeof subscribe>(noopSubscribe);

  const isNodeFocused = useSyncExternalStore(subscription.current, () =>
    isFocused(tree, nodeId),
  );

  return () => {
    if (subscription.current !== subscribe) {
      subscription.current = subscribe;
    }

    return isNodeFocused;
  };
}
