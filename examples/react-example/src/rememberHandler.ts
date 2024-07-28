import { useState, useMemo } from "react";
import {
  type NodeId,
  type ChainableHandler,
  makeHandler,
  directChildId,
} from "@fiveway/core";

export function useRememberHandler(): ChainableHandler {
  const [lastFocused, setLastFocused] = useState<NodeId | null>(null);

  return useMemo(() => {
    const handler = makeHandler((node, action, next) => {
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
    }) as ChainableHandler & {
      lastFocused: NodeId | null;
      clearMemory: () => void;
    };

    handler.lastFocused = lastFocused;
    handler.clearMemory = () => {
      setLastFocused(null);
    };

    return handler;
  }, [lastFocused, setLastFocused]);
}
