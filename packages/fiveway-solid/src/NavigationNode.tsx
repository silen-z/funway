import { type JSX, splitProps, children } from "solid-js";
import type { NodeId } from "@fiveway/core";
import {
  type NavigationContainerOptions,
  type NavigationItemOptions,
  type ContainerHandle,
  type ItemHandle,
  createNavigationContainer,
  createNavigationItem,
} from "./hooks.jsx";
import { NavigationContext, useNavigationContext } from "./context.js";

export function NodeContext(props: { node: NodeId; children: JSX.Element }) {
  const context = useNavigationContext();

  return (
    <NavigationContext.Provider value={{ ...context, parentNode: props.node }}>
      {props.children}
    </NavigationContext.Provider>
  );
}

export type NavigationContainerProps = NavigationContainerOptions & {
  children: ((node: ContainerHandle) => JSX.Element) | JSX.Element;
};

export function NavigationContainer(props: NavigationContainerProps) {
  const [, options] = splitProps(props, ["children"]);
  const node = createNavigationContainer(() => options);

  return (
    <node.Context>
      {children(() => {
        const child = props.children;

        return typeof child === "function" ? child(node) : child;
      })()}
    </node.Context>
  );
}

export type NavigationItemProps = NavigationItemOptions & {
  children: JSX.Element | ((node: ItemHandle) => JSX.Element);
};

export function NavigationItem(props: NavigationItemProps) {
  const [, options] = splitProps(props, ["children"]);
  const node = createNavigationItem(options);

  return children(() => {
    const child = props.children;

    return typeof child === "function" ? child(node) : child;
  })();
}
