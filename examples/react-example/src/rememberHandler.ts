import { useState, useMemo } from "react";
import {
  type NodeId,
  type NavigationHandler,
  directChildId,
  NavigationNode,
  NavigationAction,
  HandlerNext,
} from "@fiveway/core";

export type RememberHandler = NavigationHandler & {
  lastFocused: NodeId | null;
  clearMemory: () => void;
};

export function useRememberHandler(): RememberHandler {
  const [lastFocused, setLastFocused] = useState<NodeId | null>(null);

  return useMemo(() => {
    const handler = (
      node: NavigationNode,
      action: NavigationAction,
      next: HandlerNext
    ) => {
      if (action.kind === "focus" && lastFocused !== null) {
        try {
          return next(lastFocused, action);
        } catch {}
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
