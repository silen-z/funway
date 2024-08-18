import { useState, useCallback, useSyncExternalStore } from "react";
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