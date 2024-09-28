import {
  spatialHandler,
  captureHandler,
  itemHandler,
  type NavigationHandler,
} from "@fiveway/core";
import { useElementHandler, useNavigationNode } from "@fiveway/react";
import css from "./SpatialExample.module.css";
import itemCss from "./NavItem.module.css";
import type { CSSProperties } from "react";

export function SpatialExample() {
  const nav = useNavigationNode({
    id: "spatial",
    handler: spatialHandler.prepend(captureHandler),
  });

  return (
    <nav.Context>
      <div className={css.container}>
        <SpatialItem
          navId="item1"
          style={{ left: "10%", top: "10%" }}
          isMoving
        />
        <SpatialItem navId="item2" style={{ left: "20%", bottom: "10%" }} />
        <SpatialItem navId="item3" style={{ right: "20%", bottom: "10%" }} />
      </div>
    </nav.Context>
  );
}

const goBackHandler: NavigationHandler = (_, action, next) => {
  if (action.kind === "move" && action.direction === "back") {
    return "#";
  }
  return next();
};

function SpatialItem(props: {
  navId: string;
  style: CSSProperties;
  isMoving?: boolean;
}) {
  const elementHandler = useElementHandler();
  const nav = useNavigationNode({
    id: props.navId,
    handler: itemHandler().prepend(goBackHandler).prepend(elementHandler),
  });

  return (
    <div
      ref={elementHandler.register}
      className={itemCss.item + " " + css.item}
      data-is-focused={nav.isFocused()}
      data-moving={props.isMoving}
      style={props.style}
    >
      {props.navId}
    </div>
  );
}
