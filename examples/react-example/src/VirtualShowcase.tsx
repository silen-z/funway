import { useState, CSSProperties, WheelEvent } from "react";
import {
  verticalHandler,
  directChildId,
  gridHandler,
  GridPositionProvider,
} from "@fiveway/core";
import {
  useNavigationContainer,
  useOnFocus,
  NavigationItem,
} from "@fiveway/react";
import css from "./Showcase.module.css";

const items = [...new Array(42)].map((_, i) => {
  return { id: `item-${i + 1}`, order: i, label: `Item ${i + 1}` };
});

function offsetWindow(
  length: number,
  index: number,
  offsetStart: number,
  offsetEnd = offsetStart
): [number, number] {
  let start = index - offsetStart;

  let overflow = 0;
  if (start < 0) {
    overflow = -start;
    start = 0;
  }

  let end = index + offsetEnd + overflow; //TODO try overflow or 1
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

export function VirtualList() {
  const [listPosition, setListPosition] = useState(0);
  const windowRange = offsetWindow(items.length, listPosition, 3);

  const nav = useNavigationContainer({
    id: "virtual-list",
    handler: verticalHandler.prepend((node, action, next) => {
      if (action.kind === "focus") {
        try {
          return next(`${node.id}/${items[listPosition].id}`);
        } catch {}
      }

      return next();
    }),
  });

  useOnFocus(nav.id, (id) => {
    if (id === null) {
      return;
    }

    const childId = directChildId(nav.id, id)?.substring(nav.id.length + 1);
    if (childId === null) {
      return;
    }

    const newPosition = items.findIndex((i) => i.id === childId);
    if (newPosition !== -1) {
      setListPosition(newPosition);
    }
  });

  const handleListScroll = (e: WheelEvent) => {
    const step = e.deltaY > 0 ? 1 : -1;

    const nextPosition = Math.min(
      Math.max(0, listPosition + step),
      items.length - 1
    );

    setListPosition(nextPosition);
    if (nav.isFocused()) {
      nav.focus(items[nextPosition].id);
    }
  };

  return (
    <div
      onWheel={handleListScroll}
      className={css.section}
      data-is-focused={nav.isFocused()}
    >
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

export function VirtualGrid() {
  const [listPosition, setListPosition] = useState(0);

  const rows = Math.ceil(items.length / cols);
  const itemRowIndex = Math.floor(listPosition / cols);

  const windowRange = offsetWindow(rows, itemRowIndex, 1, 2);
  const gridRange: [number, number] = [
    windowRange[0] * cols,
    (windowRange[1] + 1) * cols - 1,
  ];

  const nav = useNavigationContainer({
    id: "virtual-grid",
    handler: gridHandler.prepend((node, action, next) => {
      if (action.kind === "focus") {
        try {
          const rowStart = listPosition - (listPosition % cols);
          return next(`${node.id}/${items[rowStart].id}`);
        } catch {}
      }

      return next();
    }),
  });

  useOnFocus(nav.id, (id) => {
    if (id === null) {
      return;
    }

    const childId = directChildId(nav.id, id)?.substring(nav.id.length + 1);
    if (childId === null) {
      return;
    }

    const index = items.findIndex((i) => i.id === childId);
    if (index !== -1) {
      setListPosition(index);
    }
  });

  const handleGridScroll = (e: WheelEvent) => {
    const step = e.deltaY > 0 ? cols : -cols;
    const nextPosition = listPosition + step;

    if (nextPosition < 0 || nextPosition > items.length - 1) {
      return;
    }

    setListPosition(nextPosition);
    if (nav.isFocused()) {
      // const rowStart = nextPosition - (nextPosition % cols);
      nav.focus(items[nextPosition].id);
    }
  };

  return (
    <div
      onWheel={handleGridScroll}
      className={css.section}
      data-is-focused={nav.isFocused()}
    >
      <div className={css.grid} style={{ "--cols": cols } as CSSProperties}>
        <nav.Context>
          {mapRange(items, gridRange, (item) => (
            <NavigationItem
              key={item.id}
              id={item.id}
              order={item.order}
              onSelect={() => nav.focus("#")}
            >
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
