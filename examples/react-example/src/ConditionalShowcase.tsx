import {
  horizontalHandler,
  itemHandler,
  containerHandler,
} from "@fiveway/core";
import { useNavigationNode, NavigationNode } from "@fiveway/react";
import { useState } from "react";
import { flushSync } from "react-dom";
import css from "./Showcase.module.css";

export function ConditionalShowcase() {
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
