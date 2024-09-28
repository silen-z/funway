import { useEffect } from "react";
import {
  captureHandler,
  gridHandler,
  gridItemHandler,
  initialHandler,
  itemHandler,
} from "@fiveway/core";
import {
  useFocusedId,
  useNavigationContext,
  useNavigationNode,
} from "@fiveway/react";
import css from "./Showcase.module.css";
import { VirtualList, VirtualGrid } from "./VirtualShowcase.tsx";
import { SpatialExample } from "./SpatialExample.tsx";
import { ExampleBox } from "./ExampleBox.tsx";
import { ListExample } from "./ListExample.tsx";
import { NavItem } from "./NavItem.tsx";
import { NodeElement } from "@fiveway/core/dom";

export function Showcase() {
  const { tree } = useNavigationContext();
  const nav = useNavigationNode({
    id: "showcase",
    handler: gridHandler().prepend(initialHandler("start")),
  });

  const focusedId = useFocusedId(nav.id);
  useEffect(() => {
    if (focusedId == null) {
      return;
    }

    const el = NodeElement.query(tree, focusedId);
    if (el != null) {
      el.scrollIntoView({ block: "center", behavior: "smooth" });
    }
  }, [focusedId]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowUp" || e.key === "ArrowDown") {
        e.preventDefault();
      }
    };

    window.addEventListener("keydown", handler);
    return () => {
      window.removeEventListener("keydown", handler);
    };
  }, []);

  return (
    <nav.Context>
      <div className={css.page}>
        <header className={css.pageHeader}>
          <div className={css.pageTitle}>
            <h1>
              <strong>fiveway</strong> / React demo
            </h1>
            <div className={css.titleLinks}>
              <a href="https://fiveway.io">Documentation</a>
              <a href="https://github.com/silen-z/fiveway">GitHub</a>
            </div>
          </div>
        </header>

        <div className={css.infoBox}>
          <p>
            <strong>fiveway</strong> is a TypeScript library for rich web
            applications that want to support keyboard navigation and have
            precise control over what is focused{" "}
            <a href="https://fiveway.io/what-is-fiveway">Get to know more</a>
          </p>

          <p>
            From now on let go of your mouse. This demo is controlled by
            keyboard. Arrow buttons work as expected, press enter to select and
            backspace works as back button. Pressing back resets you to start.
          </p>

          <p>
            If you are curious how does the navigation tree for this page looks
            open the devtools by clicking the "fiveway" button in bottom right
            corner. There you can see the tree structure and inspect specific
            nodes by clicking on them.
          </p>

          <NavItem
            navId="start"
            label="Start"
            order={-1}
            handler={itemHandler(() => {
              nav.focus("vertical-list");
            }).prepend(gridItemHandler({ row: 0, col: 0 }))}
          ></NavItem>
        </div>

        <div className={css.layout}>
          <ExampleBox
            navId="vertical-list"
            label="Directional stack: vertical"
            description="Directional stacks are the most common type of navigation container. They can be either vertical or horizontal and handle movement in respective directions. Use up/down arrow buttons to navigate this example"
            gridPos={{ row: 1, col: 1 }}
          >
            <ListExample direction="vertical" />
          </ExampleBox>

          <ExampleBox
            navId="horizontal-list"
            label="Directional stack: horizontal"
            description="Directional stacks are the most common type of navigation container. They can be either vertical or horizontal and handle movement in respective directions. Use up/down arrow buttons to navigate this example"
            gridPos={{ row: 1, col: 2 }}
          >
            <ListExample direction="horizontal" />
          </ExampleBox>

          <ExampleBox
            navId="initial-focus"
            label="Initial focus"
            description="Containers can be configured to focus specific child by default."
            gridPos={{ row: 2, col: 1 }}
          >
            <ListExample
              direction="horizontal"
              handler={(h) => h.prepend(initialHandler("item3"))}
            />
          </ExampleBox>

          <ExampleBox
            navId="capture-focus"
            label="Captured focus"
            description="Focus can be captured inside a container. In that case moving outside the container by arrow keys is not possible. Capture can be escaped via explicit action. In this example you can escape by pressing Back button"
            gridPos={{ row: 2, col: 2 }}
          >
            <ListExample
              direction="horizontal"
              handler={(h) =>
                h.prepend(captureHandler).prepend((n, a, next) => {
                  if (a.kind === "move" && a.direction === "back") {
                    nav.focus();
                    return null;
                  }
                  return next();
                })
              }
            />
          </ExampleBox>

          <ExampleBox
            navId="virtual-list"
            label="Virtual list"
            description="This is an example of navigation node with advanced handler setup. While virtual lists are not part of fiveway they can be easily implemented by extending vertical hander with custom one."
            gridPos={{ row: 3, col: 1 }}
          >
            <VirtualList />
          </ExampleBox>

          <ExampleBox
            navId="virtual-grid"
            label="Virtual grid"
            description="This is an example of navigation node with advanced handler setup. While virtual grid are not part of fiveway they can be easily implemented by extending grid handler with custom one."
            gridPos={{ row: 3, col: 2 }}
          >
            <VirtualGrid />
          </ExampleBox>

          <ExampleBox
            navId="spatial-nav"
            label="Spatial navigation"
            description="Spatial navigation works with real-time node positions. When directional move action is received closest non-overlapping node in given direction is focused."
            gridPos={{ row: 4, col: 1 }}
          >
            <SpatialExample />
          </ExampleBox>
        </div>
      </div>
    </nav.Context>
  );
}
