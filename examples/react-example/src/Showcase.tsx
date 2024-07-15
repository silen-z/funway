import { CSSProperties, useRef } from "react";
import {
  GridPositionProvider,
  gridHandler,
  horizontalList,
  verticalList,
} from "@fiveway/core";
import { spatialHandler } from "@fiveway/core/dom";
import {
  NavigationContainer,
  NavigationItem,
  useNavigationContainer,
  useNavigationItem,
} from "@fiveway/react";
import css from "./Showcase.module.css";

export function Showcase() {
  const ShowcaseNav = useNavigationContainer({
    id: "showcase",
    handler: gridHandler,
    initial: "horizontalList",
  });

  return (
    <div className={css.page}>
      <h1>fiveway: React example</h1>

      <div className={css.layout}>
        <ShowcaseNav.Context>
          <NavigationContainer id="verticalList">
            {(node) => {
              node.provide(GridPositionProvider, { row: 1, col: 1 });
              return <ListShowcase type="vertical" />;
            }}
          </NavigationContainer>

          <NavigationContainer id="horizontalList">
            {(node) => {
              node.provide(GridPositionProvider, { row: 1, col: 2 });
              return <ListShowcase type="horizontal" />;
            }}
          </NavigationContainer>

          <NavigationContainer id="spatial">
            {(node) => {
              node.provide(GridPositionProvider, { row: 1, col: 3 });
              return <SpatialShowcase />;
            }}
          </NavigationContainer>
        </ShowcaseNav.Context>
      </div>
    </div>
  );
}

function ListShowcase(props: { type: "vertical" | "horizontal" }) {
  const ListNav = useNavigationContainer({
    id: "list",
    handler: props.type === "vertical" ? verticalList : horizontalList,
  });

  return (
    <div className={css.section} data-is-focused={ListNav.isFocused()}>
      <ul className={css.list} data-type={props.type}>
        <ListNav.Context>
          <NavigationItem id="item1">
            {(node) => (
              <li className={css.item} data-is-focused={node.isFocused()}>
                Item 1
              </li>
            )}
          </NavigationItem>
          <NavigationItem id="item2">
            {(node) => (
              <li className={css.item} data-is-focused={node.isFocused()}>
                Item 2
              </li>
            )}
          </NavigationItem>
          <NavigationItem id="item3">
            {(node) => (
              <li className={css.item} data-is-focused={node.isFocused()}>
                Item 3
              </li>
            )}
          </NavigationItem>
        </ListNav.Context>
      </ul>
    </div>
  );
}

function SpatialShowcase() {
  const SpatialNav = useNavigationContainer({
    id: "spatial",
    handler: spatialHandler,
  });

  return (
    <div
      className={css.section + " " + css.spatialSection}
      data-is-focused={SpatialNav.isFocused()}
      style={{ position: "relative", minHeight: 250 }}
    >
      <SpatialNav.Context>
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
      </SpatialNav.Context>
    </div>
  );
}

function SpatialItem(props: { navId: string; style: CSSProperties }) {
  const elRef = useRef<HTMLDivElement>(null);
  const node = useNavigationItem({ id: props.navId, elRef });

  return (
    <div
      ref={elRef}
      className={css.item}
      data-is-focused={node.isFocused()}
      style={props.style}
    >
      {props.navId}
    </div>
  );
}
