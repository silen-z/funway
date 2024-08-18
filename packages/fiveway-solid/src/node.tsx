import type { Accessor, JSX } from "solid-js";
import type { NavigationHandler, NodeId } from "@fiveway/core";
import { useNavigationContext, NavigationContext } from "./context.jsx";

export type NodeOptions = {
  id: NodeId;
  parent?: NodeId;
  order?: number;
  handler?: NavigationHandler;
};

export type NodeHandle = {
  id: NodeId;
  isFocused: Accessor<boolean>;
  focus: (nodeId?: NodeId) => void;
};

export function NodeContext(props: { node: NodeId; children: JSX.Element }) {
  const context = useNavigationContext();

  return (
    <NavigationContext.Provider value={{ ...context, parentNode: props.node }}>
      {props.children}
    </NavigationContext.Provider>
  );
}
