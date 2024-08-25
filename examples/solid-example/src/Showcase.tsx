import { createSignal, untrack, type JSX } from "solid-js";
import {
  gridHandler,
  horizontalHandler,
  verticalHandler,
  spatialHandler,
  defaultHandler,
  initialHandler,
  containerHandler,
  gridItemHandler,
} from "@fiveway/core";
import {
  NavigationNode,
  createElementHandler,
  createNavigationNode,
} from "@fiveway/solid";
import css from "./Showcase.module.css";

export function Showcase() {
  const nav = createNavigationNode({
    id: "showcase",
    handler: gridHandler.prepend(initialHandler("horizontalList")),
  });

  return (
    <div class={css.page}>
      <h1>fiveway: Solid example</h1>

      <div class={css.layout}>
        <nav.Context>
          <NavigationNode
            id="verticalList"
            handler={containerHandler.prepend(
              gridItemHandler({ row: 1, col: 1 })
            )}
          >
            <ListShowcase type="vertical" />
          </NavigationNode>

          <NavigationNode
            id="horizontalList"
            handler={containerHandler.prepend(
              gridItemHandler({ row: 1, col: 2 })
            )}
          >
            <ListShowcase type="horizontal" />
          </NavigationNode>

          <NavigationNode
            id="spatial"
            handler={containerHandler.prepend(
              gridItemHandler({ row: 1, col: 3 })
            )}
          >
            <SpatialShowcase />
          </NavigationNode>
        </nav.Context>
      </div>
    </div>
  );
}

function ListShowcase(props: { type: "vertical" | "horizontal" }) {
  const nav = createNavigationNode({
    id: "list",
    handler: untrack(() =>
      props.type === "vertical" ? verticalHandler : horizontalHandler
    ),
  });

  return (
    <div class={css.section} data-is-focused={nav.isFocused()}>
      <ul class={css.list} data-type={props.type}>
        <nav.Context>
          <NavigationNode id="item1">
            {(node) => (
              <li class={css.item} data-is-focused={node.isFocused()}>
                Item 1
              </li>
            )}
          </NavigationNode>
          <NavigationNode id="item2">
            {(node) => (
              <li class={css.item} data-is-focused={node.isFocused()}>
                Item 2
              </li>
            )}
          </NavigationNode>
          <NavigationNode id="item3">
            {(node) => (
              <li class={css.item} data-is-focused={node.isFocused()}>
                Item 3
              </li>
            )}
          </NavigationNode>
        </nav.Context>
      </ul>
    </div>
  );
}

function SpatialShowcase() {
  const [isFocusable, setFocusable] = createSignal(true);
  const nav = createNavigationNode({
    id: "spatial",
    handler: spatialHandler,
  });

  const toggleHandler = createElementHandler();

  return (
    <div
      class={css.section}
      data-is-focused={nav.isFocused()}
      style={{ position: "relative", "min-height": "250px" }}
    >
      <nav.Context>
        <NavigationNode
          id="toggle"
          handler={defaultHandler
            .prepend(toggleHandler)
            .onSelect(() => setFocusable((on) => !on))}
        >
          {(node) => (
            <li
              class={css.item}
              ref={toggleHandler.register}
              data-is-focused={node.isFocused()}
            >
              toggle spatial
            </li>
          )}
        </NavigationNode>
        <SpatialItem
          navId="item1"
          focusable={isFocusable()}
          style={{
            position: "absolute",
            left: "50px",
            top: "150px",
            color: isFocusable() ? "#000" : "#ccc",
          }}
        />
        <SpatialItem
          navId="item2"
          focusable={isFocusable()}
          style={{
            position: "absolute",
            left: "150px",
            top: "50px",
            color: isFocusable() ? "#000" : "#ccc",
          }}
        />
        <SpatialItem
          navId="item3"
          focusable={isFocusable()}
          style={{
            position: "absolute",
            left: "250px",
            top: "200px",
            color: isFocusable() ? "#000" : "#ccc",
          }}
        />
      </nav.Context>
    </div>
  );
}

function SpatialItem(props: {
  navId: string;
  focusable: boolean;
  style: JSX.CSSProperties;
}) {
  const elementHandler = createElementHandler();
  const nav = createNavigationNode({
    id: untrack(() => props.navId),
    handler: defaultHandler
      .prepend(elementHandler)
      .prepend((n, a, next) => (props.focusable ? next() : null)),
  });

  return (
    <div
      tabIndex={0}
      class={css.item}
      ref={elementHandler.register}
      data-is-focused={nav.isFocused()}
      style={props.style}
    >
      {props.navId}
    </div>
  );
}
