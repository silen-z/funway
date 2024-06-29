import { type JSX } from "solid-js";
import {
  GridPositionProvider,
  grid,
  horizontalList,
  verticalList,
} from "@fiveway/core";
import { PositionProvider, spatial } from "@fiveway/core/dom";
import {
  NavigationContainer,
  NavigationItem,
  createFocusSignal,
  createNavigationContainer,
  createNavigationItem,
} from "@fiveway/solid";
import css from "./Showcase.module.css";

export function Showcase() {
  const { NavContext } = createNavigationContainer({
    id: "showcase",
    handler: grid,
  });

  return (
    <div class={css.page}>
      <h1>fiveway: Solid example</h1>

      <div class={css.layout}>
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
  const { node, NavContext } = createNavigationContainer({
    id: "list",
    handler: props.type === "vertical" ? verticalList : horizontalList,
  });

  const isFocused = createFocusSignal(node.id, { children: true });

  return (
    <div class={css.section} data-is-focused={isFocused()}>
      <ul class={css.list} data-type={props.type}>
        <NavContext>
          <NavigationItem id="item1">
            {(node) => {
              const isFocused = createFocusSignal(node.id);
              return (
                <li class={css.item} data-is-focused={isFocused()}>
                  Item 1
                </li>
              );
            }}
          </NavigationItem>
          <NavigationItem id="item2">
            {(node) => {
              const isFocused = createFocusSignal(node.id);
              return (
                <li class={css.item} data-is-focused={isFocused()}>
                  Item 2
                </li>
              );
            }}
          </NavigationItem>
          <NavigationItem id="item3">
            {(node) => {
              const isFocused = createFocusSignal(node.id);
              return (
                <li class={css.item} data-is-focused={isFocused()}>
                  Item 3
                </li>
              );
            }}
          </NavigationItem>
        </NavContext>
      </ul>
    </div>
  );
}

function SpatialShowcase() {
  const { node, NavContext } = createNavigationContainer({
    id: "spatial",
    handler: spatial,
  });
  const isFocused = createFocusSignal(node.id, { children: true });

  return (
    <div
      class={css.section}
      data-is-focused={isFocused()}
      style={{ position: "relative", "min-height": "250px" }}
    >
      <NavContext>
        <SpatialItem
          navId="item1"
          style={{ position: "absolute", left: "50px", top: "150px" }}
        />
        <SpatialItem
          navId="item2"
          style={{ position: "absolute", left: "150px", top: "50px" }}
        />
        <SpatialItem
          navId="item3"
          style={{ position: "absolute", left: "250px", top: "200px" }}
        />
      </NavContext>
    </div>
  );
}

function SpatialItem(props: { navId: string; style: JSX.CSSProperties }) {
  const node = createNavigationItem({ id: props.navId });

  const isFocused = createFocusSignal(node.id);

  const provideElPosition = (el: HTMLDivElement) => {
    PositionProvider.provide(node, () => {
      return el.getBoundingClientRect();
    });
  };

  return (
    <div
      class={css.item}
      ref={provideElPosition}
      data-is-focused={isFocused()}
      style={props.style}
    >
      {props.navId}
    </div>
  );
}
