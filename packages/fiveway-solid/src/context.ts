import { createContext, useContext, type Accessor } from "solid-js";
import { type NavigationTree, type NodeId } from "@fiveway/core";

export type NavigationContext = {
  tree: NavigationTree;
  parentNode: NodeId;
  focusedId: Accessor<NodeId>;
};

export const NavigationContext = createContext<NavigationContext | null>(null);

export function useNavigationContext(): NavigationContext {
  const navContext = useContext(NavigationContext);
  if (navContext == null) {
    throw new Error("expected navigation context");
  }

  return navContext;
}


