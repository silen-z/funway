import type { Accessor, JSX } from "solid-js";
import type { NavigationHandler, NodeId, Provider } from "@fiveway/core";
import { useNavigationContext, NavigationContext } from "./context.js";

export type NodeOptions = {
  id: NodeId;
  parent?: NodeId;
  focusable?: boolean;
  order?: number;
  handler?: NavigationHandler;
};

export type NodeHandle = {
  id: NodeId;
  isFocused: Accessor<boolean>;
  focus: (nodeId?: NodeId) => void;
  provide: <P extends Provider<unknown>>(
    provider: P,
    value: P extends Provider<infer V> ? Accessor<V> : never
  ) => void;
  registerElement: (el: HTMLElement) => void;
};

export function NodeContext(props: { node: NodeId; children: JSX.Element }) {
  const context = useNavigationContext();

  return (
    <NavigationContext.Provider value={{ ...context, parentNode: props.node }}>
      {props.children}
    </NavigationContext.Provider>
  );
}
