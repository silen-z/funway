import { createContext, useContext, type PropsWithChildren } from "react";
import { type NavigationTree, type NodeId } from "@fiveway/core";

export type NavigationContext = {
  tree: NavigationTree;
  parentNode: NodeId;
};

export const NavigationContext = createContext<NavigationContext | null>(null);

export type NavigationProviderProps = PropsWithChildren<{
  tree: NavigationTree;
}>;

export function NavigationProvider(props: NavigationProviderProps) {
  return (
    <NavigationContext.Provider value={{ tree: props.tree, parentNode: "#" }}>
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
