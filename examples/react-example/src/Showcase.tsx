import { useMemo, useState, type CSSProperties } from "react";
import {
  GridPositionProvider,
  gridHandler,
  horizontalHandler,
  verticalHandler,
  spatialHandler,
  makeHandler,
  NodeId,
} from "@fiveway/core";
import {
  NavigationContainer,
  NavigationItem,
  useFocusedId,
  useNavigationContainer,
  useNavigationItem,
} from "@fiveway/react";
import css from "./Showcase.module.css";

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

const items = [...new Array(43)].map((_, i) => {
  return { id: `item-${i + 1}`, order: i, label: `Item ${i + 1}` };
});

function offsetWindow(
  length: number,
  index: number,
  offset: number
): [number, number] {
  let start = index - offset;

  let overflow = 0;
  if (start < 0) {
    overflow = -start;
    start = 0;
  }

  let end = index + offset + overflow; //TODO try overflow or 1
  if (end > length - 1) {
    start = Math.max(0, start - (end - (length - 1)));
    end = length - 1;
  }

  return [start, end];
}

function mapRange<T, U>(
  array: T[],
  [start, end]: [number, number],
  mapFn: (e: T) => U
) {
  let mapped = [];
  for (
    let index = Math.max(start, 0);
    index <= end && index < array.length;
    index++
  ) {
    mapped.push(mapFn(array[index]));
  }

  return mapped;
}

function useRememberHandler() {
  const [lastFocused, setLastFocused] = useState<NodeId | null>(null);

  //   useOnFocus(nodeId, (id) => {
  // if (id !== null) {

  //   setLastFocused(id);
  // }
  //   })

  return useMemo(() => {
    const handler = makeHandler((node, action, next) => {
      if (action.kind === "focus" && lastFocused !== null) {
        try {
          return next(lastFocused, action);
        } catch {}
      }

      const nextId = next();
      if (
        nextId?.startsWith(node.id) &&
        !(action.kind === "focus" && action.direction === "initial")
      ) {
        setLastFocused(nextId);
      }

      return nextId;
    });

    return [handler, lastFocused] as const;
  }, [lastFocused, setLastFocused]);
}

function VirtualList() {
  const [rememberHandler, rememberedId] = useRememberHandler();
  const nav = useNavigationContainer({
    id: "virtual-list",
    handler: rememberHandler.append(verticalHandler),
  });

  const windowRange = useMemo(() => {
    if (rememberedId === null) {
      return offsetWindow(items.length, 0, 3);
    }
    const localId = rememberedId.substring(nav.id.length + 1);
    const index = items.findIndex((i) => i.id === localId);

    if (index === -1) {
      return offsetWindow(items.length, 0, 3);
    }

    return offsetWindow(items.length, index, 3);
  }, [items, rememberedId]);

  return (
    <div className={css.section} data-is-focused={nav.isFocused()}>
      <ul className={css.list}>
        <nav.Context>
          {mapRange(items, windowRange, (item) => (
            <NavigationItem key={item.id} id={item.id} order={item.order}>
              {(node) => (
                <li className={css.item} data-is-focused={node.isFocused()}>
                  {item.label}
                </li>
              )}
            </NavigationItem>
          ))}
        </nav.Context>
      </ul>
    </div>
  );
}

const cols = 4;

function VirtualGrid() {
  const nav = useNavigationContainer({
    id: "virtual-grid",
    handler: gridHandler,
  });

  const focusedId = useFocusedId(nav.id);

  const itemIndex = useMemo(() => {
    if (focusedId == null) {
      return 0;
    }

    const localId = focusedId.substring(nav.id.length + 1);
    const index = items.findIndex((i) => i.id === localId);

    if (index === -1) {
      return 0;
    }

    return index;
  }, [focusedId, items]);

  const rows = Math.ceil(items.length / cols);
  const itemRowIndex = Math.floor(itemIndex / cols);

  const [rowStart, rowEnd] = offsetWindow(rows, itemRowIndex, 3);

  const range: [number, number] = [rowStart * cols, (rowEnd + 1) * cols - 1];

  return (
    <div className={css.section} data-is-focused={nav.isFocused()}>
      <div className={css.grid} style={{ "--cols": cols } as CSSProperties}>
        <nav.Context>
          {mapRange(items, range, (item) => (
            <NavigationItem key={item.id} id={item.id} order={item.order}>
              {(node) => {
                node.provide(GridPositionProvider, {
                  row: Math.floor(item.order / cols),
                  col: item.order % cols,
                });
                return (
                  <div className={css.item} data-is-focused={node.isFocused()}>
                    {item.label}
                  </div>
                );
              }}
            </NavigationItem>
          ))}
        </nav.Context>
      </div>
    </div>
  );
}

function SpatialShowcase() {
  const nav = useNavigationContainer({
    id: "spatial",
    handler: spatialHandler,
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
  const nav = useNavigationItem({ id: props.navId });

  return (
    <div
      ref={nav.registerElement}
      className={css.item}
      data-is-focused={nav.isFocused()}
      style={props.style}
    >
      {props.navId}
    </div>
  );
}
