import type { ReactNode } from "react";
import {
  type NavigationContainerOptions,
  type NavigationItemOptions,
  type ContainerHandle,
  type ItemHandle,
  useNavigationContainer,
  useNavigationItem,
} from "./hooks.js";

type ContextlessContainerHandle = Omit<ContainerHandle, "Context">;

type NavigationContainerProps = NavigationContainerOptions & {
  children: ReactNode | ((props: ContextlessContainerHandle) => ReactNode);
};

export function NavigationContainer({
  children,
  ...props
}: NavigationContainerProps) {
  const { Context, ...node } = useNavigationContainer(props);

  return (
    <Context>
      {typeof children === "function" ? children(node) : children}
    </Context>
  );
}

type NavigationItemProps = NavigationItemOptions & {
  children: ReactNode | ((handle: ItemHandle) => ReactNode);
};

export function NavigationItem({ children, ...props }: NavigationItemProps) {
  const node = useNavigationItem(props);

  return typeof children === "function" ? children(node) : children;
}
