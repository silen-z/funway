import { spatialHandler, captureHandler, defaultHandler } from "@fiveway/core";
import { useNavigationNode } from "@fiveway/react";
import { CSSProperties } from "react";
import css from "./Showcase.module.css";
import { useElementHandler } from "@fiveway/react";

export function SpatialShowcase() {
  const nav = useNavigationNode({
    id: "spatial",
    handler: spatialHandler.prepend(captureHandler),
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
  const elementHandler = useElementHandler();
  const nav = useNavigationNode({
    id: props.navId,
    handler: defaultHandler
      .prepend(elementHandler)
      .onSelect(() => nav.focus("#")),
  });

  return (
    <div
      ref={elementHandler.register}
      className={css.item}
      data-is-focused={nav.isFocused()}
      style={props.style}
    >
      {props.navId}
    </div>
  );
}
