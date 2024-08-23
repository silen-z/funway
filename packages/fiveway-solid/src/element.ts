import { createEffect, createSignal, onCleanup } from "solid-js";
import {
  chainedHandler,
  handleAction,
  NodePosition,
  registerListener,
  type HandlerChain,
  type NavigationAction,
  type NavigationTree,
} from "@fiveway/core";
import { defaultEventMapping, NodeElement } from "@fiveway/core/dom";

export type ElementHandler = HandlerChain & {
  register: (e: HTMLElement | null) => void;
};

export function createElementHandler() {
  const [element, setElement] = createSignal<HTMLElement | null>(null);
  const position = () => element()?.getBoundingClientRect() ?? null;

  // handlers doen't need to be reactive
  const handler = chainedHandler()
    // eslint-disable-next-line solid/reactivity
    .prepend(NodeElement.providerHandler(element))
    // eslint-disable-next-line solid/reactivity
    .prepend(NodePosition.providerHandler(position)) as ElementHandler;

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
