import { type ReactNode } from "react";
import { type NavigationItem } from "@fiveway/core";
import {
  type NavigationContainerHandle,
  type NavigationContainerOptions,
  type NavigationItemOptions,
  useNavigationContainer,
  useNavigationItem,
  useIsFocused,
} from "./hooks.js";

type NavContainerRenderProps = Omit<NavigationContainerHandle, "NavContext">;

export type NavigationContainerProps = NavigationContainerOptions & {
  children: ReactNode | ((props: NavContainerRenderProps) => ReactNode);
};

export function NavigationContainer({
  children,
  ...props
}: NavigationContainerProps) {
  const { NavContext, ...node } = useNavigationContainer(props);

  return (
    <NavContext>
      {typeof children === "function" ? children(node) : children}
    </NavContext>
  );
}

export type NavigationItemProps = NavigationItemOptions & {
  children: ReactNode | ((isFocused: boolean) => ReactNode);
};

export function NavigationItem({ children, ...props }: NavigationItemProps) {
  const node = useNavigationItem(props);
  const isFocused = useIsFocused(node.id);

  return typeof children === "function" ? children(isFocused) : children;
}
