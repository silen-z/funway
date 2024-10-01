import type { CSSProperties } from "react";
import { spatialHandler, captureHandler } from "@fiveway/core";
import { useNavigationNode } from "@fiveway/react";
import { NavItem } from "./NavItem.tsx";
import css from "./SpatialExample.module.css";

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

function SpatialItem(props: {
  navId: string;
  style: CSSProperties;
  isMoving?: boolean;
}) {
  return (
    <div className={css.item} data-moving={props.isMoving} style={props.style}>
      <NavItem navId={props.navId} label={props.navId} />
    </div>
  );
}
