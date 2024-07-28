import {
  GridPositionProvider,
  gridHandler,
  horizontalHandler,
  verticalHandler,
} from "@fiveway/core";
import {
  NavigationContainer,
  NavigationItem,
  useNavigationContainer,
} from "@fiveway/react";
import css from "./Showcase.module.css";
import { VirtualList, VirtualGrid } from "./VirtualShowcase.tsx";
import { SpatialShowcase } from "./SpatialShowcase.tsx";

export function Showcase() {
  const nav = useNavigationContainer({
    id: "showcase",
    handler: gridHandler,
    initial: "horizontalList",
  });

  return (
    <div className={css.page}>
      <h1>fiveway: React example</h1>

      <div className={css.layout}>
        <nav.Context>
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

          <NavigationContainer id="virtual">
            {(node) => {
              node.provide(GridPositionProvider, { row: 1, col: 3 });
              return <VirtualList />;
            }}
          </NavigationContainer>

          <NavigationContainer id="virtual-grid">
            {(node) => {
              node.provide(GridPositionProvider, { row: 1, col: 4 });
              return <VirtualGrid />;
            }}
          </NavigationContainer>

          <NavigationContainer id="spatial">
            {(node) => {
              node.provide(GridPositionProvider, { row: 2, col: 1 });
              return <SpatialShowcase />;
            }}
          </NavigationContainer>
        </nav.Context>
      </div>
    </div>
  );
}

function ListShowcase(props: { type: "vertical" | "horizontal" }) {
  const nav = useNavigationContainer({
    id: "list",
    handler: props.type === "vertical" ? verticalHandler : horizontalHandler,
  });

  return (
    <div className={css.section} data-is-focused={nav.isFocused()}>
      <ul className={css.list} data-type={props.type}>
        <nav.Context>
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
        </nav.Context>
      </ul>
    </div>
  );
}
