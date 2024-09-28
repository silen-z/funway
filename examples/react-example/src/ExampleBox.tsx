import {
  GridItem,
  containerHandler,
  gridItemHandler,
  type NodeId,
} from "@fiveway/core";
import { useNavigationNode } from "@fiveway/react";
import type { ReactNode } from "react";
import css from "./ExampleBox.module.css";

type ExampleBoxProps = {
  navId: NodeId;
  gridPos: GridItem;
  label: string;
  description: string;
  children: ReactNode;
};

export function ExampleBox(props: ExampleBoxProps) {
  const nav = useNavigationNode({
    id: props.navId,
    handler: containerHandler.prepend(gridItemHandler(props.gridPos)),
  });

  return (
    <div className={css.box} data-is-focused={nav.isFocused()}>
      <div className={css.label}>{props.label}</div>
      <div className={css.description}>{props.description}</div>
      <div className={css.content}>
        <nav.Context>{props.children}</nav.Context>
      </div>
    </div>
  );
}
