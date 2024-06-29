import { CSSProperties, useRef } from "react";
import {
  GridPositionProvider,
  grid,
  horizontalList,
  verticalList,
} from "@fiveway/core";
import { spatial } from "@fiveway/core/dom";
import {
  NavigationContainer,
  NavigationItem,
  useHasFocusWithin,
  useIsFocused,
  useNavigationContainer,
  useNavigationItem,
} from "@fiveway/react";
import css from "./Showcase.module.css";

export function Showcase() {
  const { NavContext } = useNavigationContainer({
    id: "showcase",
    handler: grid,
  });

  return (
    <div className={css.page}>
      <h1>fiveway: React example</h1>

      <div className={css.layout}>
        <NavContext>
          <NavigationContainer id="verticalList">
            {(node) => {
              GridPositionProvider.provide(node.node, { row: 1, col: 1 });
              return <ListShowcase type="vertical" />;
            }}
          </NavigationContainer>

          <NavigationContainer id="horizontalList">
            {(node) => {
              GridPositionProvider.provide(node.node, { row: 1, col: 2 });
              return <ListShowcase type="horizontal" />;
            }}
          </NavigationContainer>

          <NavigationContainer id="spatial">
            {(node) => {
              GridPositionProvider.provide(node.node, { row: 1, col: 3 });
              return <SpatialShowcase />;
            }}
          </NavigationContainer>
        </NavContext>
      </div>
    </div>
  );
}

function ListShowcase(props: { type: "vertical" | "horizontal" }) {
  const { node, NavContext } = useNavigationContainer({
    id: "list",
    handler: props.type === "vertical" ? verticalList : horizontalList,
  });

  const isFocused = useHasFocusWithin(node.id);

  return (
    <div className={css.section} data-is-focused={isFocused}>
      <ul className={css.list} data-type={props.type}>
        <NavContext>
          <NavigationItem id="item1">
            {(isFocused) => (
              <li className={css.item} data-is-focused={isFocused}>
                Item 1
              </li>
            )}
          </NavigationItem>
          <NavigationItem id="item2">
            {(isFocused) => (
              <li className={css.item} data-is-focused={isFocused}>
                Item 2
              </li>
            )}
          </NavigationItem>
          <NavigationItem id="item3">
            {(isFocused) => (
              <li className={css.item} data-is-focused={isFocused}>
                Item 3
              </li>
            )}
          </NavigationItem>
        </NavContext>
      </ul>
    </div>
  );
}

function SpatialShowcase() {
  const { node, NavContext } = useNavigationContainer({
    id: "spatial",
    handler: spatial,
  });

  const isFocused = useHasFocusWithin(node.id);

  return (
    <div
      className={css.section}
      data-is-focused={isFocused}
      style={{ position: "relative", minHeight: 250 }}
    >
      <NavContext>
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
      </NavContext>
    </div>
  );
}

function SpatialItem(props: { navId: string; style: CSSProperties }) {
  const elRef = useRef<HTMLDivElement>(null);
  const node = useNavigationItem({ id: props.navId, elRef });
  const isFocused = useIsFocused(node.id);

  return (
    <div
      ref={elRef}
      className={css.item}
      data-is-focused={isFocused}
      style={props.style}
    >
      {props.navId}
    </div>
  );
}
