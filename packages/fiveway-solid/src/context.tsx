import {
  createContext,
  createEffect,
  createSignal,
  onCleanup,
  useContext,
  type Accessor,
  type JSX,
} from "solid-js";
import {
  registerListener,
  type NavigationAction,
  type NavigationTree,
  type NodeId,
} from "@fiveway/core";

export type NavigationContext = {
  tree: NavigationTree;
  parentNode: NodeId;
  focusedId: Accessor<NodeId>;
};

export const NavigationContext = createContext<NavigationContext | null>(null);

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

  createEffect(() => {
    const cleanup = registerListener(tree, {
      type: "focuschange",
      node: "#",
      fn: () => setFocusedId(tree.focusedId),
    });

    onCleanup(cleanup);
  });

  return (
    <NavigationContext.Provider value={{ tree, parentNode: "#", focusedId }}>
      {props.children}
    </NavigationContext.Provider>
  );
}

export function useNavigationContext(): NavigationContext {
  const navContext = useContext(NavigationContext);
  if (navContext == null) {
    throw new Error("expected navigation context");
  }

  return navContext;
}
