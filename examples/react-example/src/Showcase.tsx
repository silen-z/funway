import { useState } from "react";
import { flushSync } from "react-dom";
import {
  defaultHandler,
  gridHandler,
  GridPosition,
  horizontalHandler,
  initialHandler,
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
    handler: gridHandler.prepend(initialHandler("horizontalList")),
  });

  return (
    <div className={css.page}>
      <h1>fiveway: React example</h1>

      <div className={css.layout}>
        <nav.Context>
          <NavigationContainer
            id="verticalList"
            handler={defaultHandler.provide(GridPosition, { row: 1, col: 1 })}
          >
            <ListShowcase type="vertical" />
          </NavigationContainer>

          <NavigationContainer
            id="horizontalList"
            handler={defaultHandler.provide(GridPosition, { row: 1, col: 2 })}
          >
            <ListShowcase type="horizontal" />
          </NavigationContainer>

          <NavigationContainer
            id="virtual"
            handler={defaultHandler.provide(GridPosition, { row: 1, col: 3 })}
          >
            <VirtualList />
          </NavigationContainer>

          <NavigationContainer
            id="virtual-grid"
            handler={defaultHandler.provide(GridPosition, { row: 1, col: 4 })}
          >
            <VirtualGrid />
          </NavigationContainer>

          <NavigationContainer
            id="spatial"
            handler={defaultHandler.provide(GridPosition, { row: 2, col: 1 })}
          >
            <SpatialShowcase />
          </NavigationContainer>

          <NavigationContainer
            id="conditional"
            handler={defaultHandler.provide(GridPosition, { row: 2, col: 2 })}
          >
            <ConditionalShowcase />
          </NavigationContainer>
        </nav.Context>
      </div>
    </div>
  );
}

function ListShowcase(props: { type: "vertical" | "horizontal" }) {
  const movementHandler =
    props.type === "vertical" ? verticalHandler : horizontalHandler;

  const nav = useNavigationContainer({
    id: "list",
    handler: movementHandler.prepend(initialHandler("item2")),
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

function ConditionalShowcase() {
  const nav = useNavigationContainer({
    id: "section",
    handler: horizontalHandler,
  });

  const [isOn, setOn] = useState(false);

  return (
    <div className={css.section} data-is-focused={nav.isFocused()}>
      <div style={{ display: "flex" }}>
        <nav.Context>
          <NavigationItem
            id="toggle"
            handler={defaultHandler.onSelect(() => {
              flushSync(() => {
                setOn((on) => !on);
              });

              nav.focus("content");
            })}
          >
            {(node) => (
              <button className={css.item} data-is-focused={node.isFocused()}>
                {isOn ? "hide" : "show"}
              </button>
            )}
          </NavigationItem>

          <NavigationContainer
            id="content"
            handler={defaultHandler.prepend((node, action, next) => {
              if (action.kind === "focus" && isOn) {
                return next() ?? node.id;
              }

              return next();
            })}
          >
            {isOn && (
              <NavigationItem
                id="parking"
                handler={defaultHandler.onSelect(() => {
                  setOn(false);
                })}
              >
                {(node) => (
                  <button
                    className={css.item}
                    data-is-focused={node.isFocused()}
                  >
                    remove
                  </button>
                )}
              </NavigationItem>
            )}
          </NavigationContainer>
        </nav.Context>
      </div>
    </div>
  );
}
