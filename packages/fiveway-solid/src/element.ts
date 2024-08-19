import { createEffect, createSignal, onCleanup } from "solid-js";
import {
  chainedHandler,
  handleAction,
  NodePosition,
  queryable,
  registerListener,
  type HandlerChain,
  type NavigationAction,
  type NavigationTree,
  type Queryable,
} from "@fiveway/core";
import { defaultEventMapping } from "@fiveway/core/dom";

export const NodeElement: Queryable<HTMLElement> = queryable("NodeElement");

export type ElementHandler = HandlerChain & {
  register: (e: HTMLElement | null) => void;
};

export function createElementHandler() {
  const [element, setElement] = createSignal<HTMLElement | null>(null);
  const position = () => element()?.getBoundingClientRect() ?? null;

  const handler = chainedHandler()
    .prepend(NodeElement.handler(element))
    .prepend(NodePosition.handler(position)) as ElementHandler;

  handler.register = setElement;

  return handler;
}

export function useActionHandler(
  tree: NavigationTree,
  target: EventTarget = window,
  eventToAction: (e: Event) => NavigationAction | null = defaultEventMapping
) {
  createEffect(() => {
    const handler = (e: Event) => {
      const action = eventToAction(e);
      if (action === null) {
        return;
      }

      handleAction(tree, action);
    };
    target.addEventListener("keydown", handler);

    onCleanup(() => {
      target.removeEventListener("keydown", handler);
    });
  });
}

export function useSyncFocus(tree: NavigationTree) {
  createEffect(() => {
    const cleanup = registerListener(tree, {
      node: "#",
      type: "focuschange",
      fn: () => {
        const el = NodeElement.query(tree, tree.focusedId);
        if (el !== null) {
          el.focus();
        } else if (document.activeElement instanceof HTMLElement) {
          document.activeElement.blur();
        }
      },
    });

    onCleanup(cleanup);
  });
}
