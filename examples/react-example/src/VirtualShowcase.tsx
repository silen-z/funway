import { type CSSProperties, type WheelEvent, useState } from "react";
import {
  verticalHandler,
  directChildId,
  gridHandler,
  gridItemHandler,
  itemHandler,
  isParent,
} from "@fiveway/core";
import { useNavigationNode, useOnFocus, NavigationNode } from "@fiveway/react";
import css from "./Showcase.module.css";

const items = [...new Array(42)].map((_, i) => {
  return { id: `item-${i + 1}`, order: i, label: `Item ${i + 1}` };
});

function offsetWindow(
  length: number,
  index: number,
  offsetStart: number,
  offsetEnd = offsetStart,
): [number, number] {
  let start = index - offsetStart;

  let overflow = 0;
  if (start < 0) {
    overflow = -start;
    start = 0;
  }

  let end = index + offsetEnd + overflow;
  if (end > length - 1) {
    start = Math.max(0, start - (end - (length - 1)));
    end = length - 1;
  }

  return [start, end];
}

function mapRange<T, U>(
  array: T[],
  [start, end]: [number, number],
  mapFn: (e: T) => U,
) {
  const mapped = [];
  for (
    let index = Math.max(start, 0);
    index <= end && index < array.length;
    index++
  ) {
    mapped.push(mapFn(array[index]!));
  }

  return mapped;
}

export function VirtualList() {
  const [listPosition, setListPosition] = useState(0);
  const windowRange = offsetWindow(items.length, listPosition, 3);

  const nav = useNavigationNode({
    id: "virtual-list",
    handler: verticalHandler.prepend((node, action, next) => {
      if (action.kind === "focus" && items[listPosition] != null) {
        // if this is a refocus due to children changing
        // skip if some child is already focused
        if (
          action.direction === "initial" &&
          isParent(node.id, node.tree.focusedId)
        ) {
          return null;
        }

        try {
          return next(`${node.id}/${items[listPosition].id}`);
        } catch {
          return next();
        }
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
      items.length - 1,
    );

    setListPosition(nextPosition);
    if (nav.isFocused() && items[nextPosition] != null) {
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
            <NavigationNode key={item.id} id={item.id} order={item.order}>
              {(node) => (
                <li className={css.item} data-is-focused={node.isFocused()}>
                  {item.label}
                </li>
              )}
            </NavigationNode>
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

  const nav = useNavigationNode({
    id: "virtual-grid",
    handler: gridHandler().prepend((node, action, next) => {
      const rowStart = listPosition - (listPosition % cols);
      if (action.kind === "focus" && items[rowStart] != null) {
        // if this is a refocus due to children changing
        // skip if some child is already focused
        if (
          action.direction === "initial" &&
          isParent(node.id, node.tree.focusedId)
        ) {
          return null;
        }

        try {
          return next(`${node.id}/${items[rowStart].id}`);
        } catch {
          return next();
        }
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
    if (nav.isFocused() && items[nextPosition] != null) {
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
          {mapRange(items, gridRange, (item) => {
            const gridPosition = {
              row: Math.floor(item.order / cols),
              col: item.order % cols,
            };

            return (
              <NavigationNode
                key={item.id}
                id={item.id}
                order={item.order}
                handler={itemHandler(() => {
                  nav.focus("#");
                }).prepend(gridItemHandler(gridPosition))}
              >
                {(node) => (
                  <div className={css.item} data-is-focused={node.isFocused()}>
                    {item.label}
                  </div>
                )}
              </NavigationNode>
            );
          })}
        </nav.Context>
      </div>
    </div>
  );
}
