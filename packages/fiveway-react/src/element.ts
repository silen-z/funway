import { useRef, useMemo, useEffect } from "react";
import {
  type NavigationTree,
  type NavigationAction,
  type HandlerChain,
  type Queryable,
  handleAction,
  chainedHandler,
  registerListener,
  queryable,
  NodePosition,
} from "@fiveway/core";
import { defaultEventMapping } from "@fiveway/core/dom";

export const NodeElement: Queryable<HTMLElement> = queryable("Element");

export type ElementHandler = HandlerChain & {
  register: (e: HTMLElement | null) => void;
};

export function useElementHandler() {
  const elementRef = useRef<HTMLElement | null>(null);

  return useMemo(() => {
    const position = () => elementRef.current?.getBoundingClientRect() ?? null;

    const handler = chainedHandler()
      .prepend(NodeElement.handler(() => elementRef.current))
      .prepend(NodePosition.handler(position)) as ElementHandler;

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
