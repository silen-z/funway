import { useState } from "react";
import {
  containerHandler,
  gridHandler,
  gridItemHandler,
  horizontalHandler,
  initialHandler,
  itemHandler,
  verticalHandler,
} from "@fiveway/core";
import { NavigationNode, useNavigationNode } from "@fiveway/react";
import css from "./Showcase.module.css";
import { VirtualList, VirtualGrid } from "./VirtualShowcase.tsx";
import { SpatialShowcase } from "./SpatialShowcase.tsx";
import { flushSync } from "react-dom";

export function Showcase() {
  const nav = useNavigationNode({
    id: "showcase",
    handler: gridHandler().prepend(initialHandler("horizontalList")),
  });

  return (
    <div className={css.page}>
      <h1>fiveway: React example</h1>

      <div className={css.layout}>
        <nav.Context>
          <NavigationNode
            id="verticalList"
            handler={containerHandler.prepend(
              gridItemHandler({ row: 1, col: 1 }),
            )}
          >
            <ListShowcase type="vertical" />
          </NavigationNode>

          <NavigationNode
            id="horizontalList"
            handler={containerHandler.prepend(
              gridItemHandler({ row: 1, col: 2 }),
            )}
          >
            <ListShowcase type="horizontal" />
          </NavigationNode>

          <NavigationNode
            id="virtual"
            handler={containerHandler.prepend(
              gridItemHandler({ row: 1, col: 3 }),
            )}
          >
            <VirtualList />
          </NavigationNode>

          <NavigationNode
            id="virtual-grid"
            handler={containerHandler.prepend(
              gridItemHandler({ row: 1, col: 4 }),
            )}
          >
            <VirtualGrid />
          </NavigationNode>

          <NavigationNode
            id="spatial"
            handler={containerHandler.prepend(
              gridItemHandler({ row: 2, col: 1 }),
            )}
          >
            <SpatialShowcase />
          </NavigationNode>

          <NavigationNode
            id="conditional"
            handler={containerHandler.prepend(
              gridItemHandler({ row: 2, col: 2 }),
            )}
          >
            <ConditionalShowcase />
          </NavigationNode>
        </nav.Context>
      </div>
    </div>
  );
}

function ListShowcase(props: { type: "vertical" | "horizontal" }) {
  const movementHandler =
    props.type === "vertical" ? verticalHandler : horizontalHandler;

  const nav = useNavigationNode({
    id: "list",
    handler: movementHandler.prepend(initialHandler("item2")),
  });

  return (
    <div className={css.section} data-is-focused={nav.isFocused()}>
      <ul className={css.list} data-type={props.type}>
        <nav.Context>
          <NavigationNode id="item1">
            {(node) => (
              <li className={css.item} data-is-focused={node.isFocused()}>
                Item 1
              </li>
            )}
          </NavigationNode>
          <NavigationNode id="item2">
            {(node) => (
              <li className={css.item} data-is-focused={node.isFocused()}>
                Item 2
              </li>
            )}
          </NavigationNode>
          <NavigationNode id="item3">
            {(node) => (
              <li className={css.item} data-is-focused={node.isFocused()}>
                Item 3
              </li>
            )}
          </NavigationNode>
        </nav.Context>
      </ul>
    </div>
  );
}

function ConditionalShowcase() {
  const nav = useNavigationNode({
    id: "section",
    handler: horizontalHandler,
  });

  const [isOn, setOn] = useState(false);

  return (
    <div className={css.section} data-is-focused={nav.isFocused()}>
      <div style={{ display: "flex" }}>
        <nav.Context>
          <NavigationNode
            id="toggle"
            handler={itemHandler(() => {
              flushSync(() => {
                setOn((on) => !on);
              });
              if (!isOn) {
                nav.focus("content");
              }
            })}
          >
            {(node) => (
              <button className={css.item} data-is-focused={node.isFocused()}>
                {isOn ? "hide" : "show"}
              </button>
            )}
          </NavigationNode>

          <NavigationNode id="content" handler={containerHandler}>
            {isOn && (
              <NavigationNode
                id="parking"
                handler={itemHandler(() => {
                  setOn(false);
                  nav.focus();
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
              </NavigationNode>
            )}
          </NavigationNode>
        </nav.Context>
      </div>
    </div>
  );
}
