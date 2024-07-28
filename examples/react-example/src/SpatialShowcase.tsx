import { spatialHandler } from "@fiveway/core";
import { useNavigationContainer, useNavigationItem } from "@fiveway/react";
import { CSSProperties } from "react";
import css from "./Showcase.module.css";

export function SpatialShowcase() {
  const nav = useNavigationContainer({
    id: "spatial",
    handler: spatialHandler,
  });

  return (
    <div
      className={css.section + " " + css.spatialSection}
      data-is-focused={nav.isFocused()}
      style={{ position: "relative", minHeight: 250 }}
    >
      <nav.Context>
        <SpatialItem
          navId="item1"
          style={{ position: "absolute", left: 50, top: 150 }}
        />
        <SpatialItem
          navId="item2"
          style={{ position: "absolute", left: 150, top: 50 }}
        />
        <SpatialItem
          navId="item3"
          style={{ position: "absolute", left: 250, top: 200 }}
        />
      </nav.Context>
    </div>
  );
}

function SpatialItem(props: { navId: string; style: CSSProperties }) {
  const nav = useNavigationItem({ id: props.navId });

  return (
    <div
      ref={nav.registerElement}
      className={css.item}
      data-is-focused={nav.isFocused()}
      style={props.style}
    >
      {props.navId}
    </div>
  );
}
