import {
  itemHandler,
  type ChainedHandler,
  type NavigationHandler,
  type NodeId,
} from "@fiveway/core";
import { useElementHandler, useNavigationNode } from "@fiveway/react";
import css from "./NavItem.module.css";

type NavItemProps = {
  navId: NodeId;
  order?: number;
  onSelect?: () => void;
  label: string;
  handler?: ChainedHandler;
};

const goBackHandler: NavigationHandler = (_, action, next) => {
  if (action.kind === "move" && action.direction === "back") {
    return "#";
  }
  return next();
};

export function NavItem(props: NavItemProps) {
  const elementHandler = useElementHandler();

  const nav = useNavigationNode({
    id: props.navId,
    order: props.order,
    handler: (props.handler ?? itemHandler())
      .prepend(goBackHandler)
      .prepend(elementHandler),
  });

  return (
    <div
      ref={elementHandler.register}
      className={css.item}
      data-is-focused={nav.isFocused()}
    >
      {props.label}
    </div>
  );
}
