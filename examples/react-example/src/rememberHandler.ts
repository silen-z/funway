import { useState, useMemo } from "react";
import {
  type NodeId,
  type NavigationHandler,
  directChildId,
} from "@fiveway/core";

export type RememberHandler = NavigationHandler & {
  lastFocused: NodeId | null;
  clearMemory: () => void;
};

export function useRememberHandler() {
  const [lastFocused, setLastFocused] = useState<NodeId | null>(null);

  return useMemo(() => {
    const handler: RememberHandler = (node, action, next) => {
      if (action.kind === "focus" && lastFocused !== null) {
        try {
          return next(lastFocused, action);
        } catch {
          // continue
        }
      }

      const nextId = next();
      const idToSave = nextId !== null ? directChildId(node.id, nextId) : null;
      if (
        idToSave !== null &&
        !(action.kind === "focus" && action.direction === "initial")
      ) {
        setLastFocused(idToSave);
      }

      return nextId;
    };

    handler.lastFocused = lastFocused;
    handler.clearMemory = () => {
      setLastFocused(null);
    };

    return handler;
  }, [lastFocused, setLastFocused]);
}
