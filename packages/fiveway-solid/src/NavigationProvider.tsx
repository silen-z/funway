import { type JSX, createSignal, onCleanup, createEffect } from "solid-js";
import {
  type NavigationAction,
  type NavigationTree,
  handleNavigation,
  registerFocusListener,
  getNode,
} from "@fiveway/core";
import { defaultEventMapping } from "@fiveway/core/dom";
import { NavigationContext } from "./context.js";
import { ElementProvider } from "./hooks.jsx";

type NavigationProviderProps = {
  tree: NavigationTree;
  fromEvent?: (e: KeyboardEvent) => NavigationAction | null;
  children: JSX.Element;
};

export function NavigationProvider(props: NavigationProviderProps) {
  // reactive tree prop is not supported
  // eslint-disable-next-line solid/reactivity
  const tree = props.tree;

  const [focusedId, setFocusedId] = createSignal(tree.focusedId);

  const cleanupFocusListener = registerFocusListener(tree, () => {
    setFocusedId(tree.focusedId);
  });

  const handler = (e: KeyboardEvent) => {
    const mapFn = props.fromEvent ?? defaultEventMapping;

    const action = mapFn(e);
    if (action === null) {
      return;
    }

    handleNavigation(tree, action);
  };
  window.addEventListener("keydown", handler);

  onCleanup(() => {
    cleanupFocusListener();
    window.removeEventListener("keydown", handler);
  });

  createEffect(() => {
    const node = getNode(tree, focusedId());
    const el = ElementProvider.extract(node);
    if (el !== null) {
      el.focus();
    } else if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  });

  return (
    <NavigationContext.Provider
      value={{ tree, parentNode: tree.root.id, focusedId }}
    >
      {props.children}
    </NavigationContext.Provider>
  );
}
