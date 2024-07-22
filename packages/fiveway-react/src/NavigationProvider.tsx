import { type PropsWithChildren, useEffect, useRef } from "react";
import {
  type NavigationAction,
  type NavigationTree,
  handleAction,
  registerFocusListener,
  getNode,
} from "@fiveway/core";
import { defaultEventMapping } from "@fiveway/core/dom";
import { NavigationContext } from "./context.js";
import { ElementProvider } from "./hooks.js";

export type NavigationProviderProps = PropsWithChildren<{
  tree: NavigationTree;
  fromEvent?: (e: KeyboardEvent) => NavigationAction | null;
}>;

export function NavigationProvider({
  tree,
  children,
  fromEvent = defaultEventMapping,
}: NavigationProviderProps) {
  const handlerRef = useRef((e: KeyboardEvent) => {
    const action = fromEvent(e);
    if (action === null) {
      return;
    }

    handleAction(tree, action);
  });

  useEffect(() => {
    const handler = handlerRef.current;
    window.addEventListener("keydown", handler);

    return () => {
      window.removeEventListener("keydown", handler);
    };
  }, []);

  useEffect(() => {
    const handler = () => {
      const node = getNode(tree, tree.focusedId);
      const el = ElementProvider.extract(node);
      if (el != null) {
        el.focus();
      }
    };

    return registerFocusListener(tree, {
      type: "focuschange",
      node: "#",
      fn: handler,
    });
  }, [tree]);

  return (
    <NavigationContext.Provider value={{ tree, parentNode: tree.root.id }}>
      {children}
    </NavigationContext.Provider>
  );
}
