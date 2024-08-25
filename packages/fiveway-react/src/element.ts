import { useRef, useMemo, useEffect } from "react";
import {
  type NavigationTree,
  type NavigationAction,
  type ChainedHandler,
  handleAction,
  chainedHandler,
  registerListener,
  NodePosition,
} from "@fiveway/core";
import { defaultEventMapping, NodeElement } from "@fiveway/core/dom";

export type ElementHandler = ChainedHandler & {
  register: (e: HTMLElement | null) => void;
};

export function useElementHandler() {
  const elementRef = useRef<HTMLElement | null>(null);

  return useMemo(() => {
    const handler = chainedHandler([
      NodeElement.providerHandler(() => elementRef.current),
      NodePosition.providerHandler(() => {
        return elementRef.current?.getBoundingClientRect() ?? null;
      }),
    ]) as ElementHandler;

    handler.register = (element) => {
      elementRef.current = element;
    };

    return handler;
  }, []);
}

export function useActionHandler(
  tree: NavigationTree,
  target: EventTarget = window,
  eventToAction: (e: Event) => NavigationAction | null = defaultEventMapping
) {
  useEffect(() => {
    const handler = (e: Event) => {
      const action = eventToAction(e);
      if (action === null) {
        return;
      }

      handleAction(tree, action);
    };

    target.addEventListener("keydown", handler);

    return () => {
      target.removeEventListener("keydown", handler);
    };
  }, [tree, target, eventToAction]);
}

export function useSyncFocus(tree: NavigationTree) {
  useEffect(() => {
    const handler = () => {
      const el = NodeElement.query(tree, tree.focusedId);
      if (el != null) {
        el.focus();
      }
    };

    return registerListener(tree, {
      type: "focuschange",
      node: "#",
      fn: handler,
    });
  }, [tree]);
}
