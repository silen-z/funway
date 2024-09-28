import { type CSSProperties, useState } from "react";
import {
  verticalHandler,
  directChildId,
  gridHandler,
  gridItemHandler,
  itemHandler,
  isRefocus,
} from "@fiveway/core";
import { useNavigationNode, useOnFocus } from "@fiveway/react";
import css from "./Showcase.module.css";
import { NavItem } from "./NavItem";

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
      if (action.kind === "focus" && !isRefocus(node, action)) {
        const item = items[listPosition];
        if (item == null) {
          return next();
        }

        try {
          return next(`${node.id}/${item.id}`);
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

  return (
    <ul
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        padding: "16px",
      }}
    >
      <nav.Context>
        {mapRange(items, windowRange, (item) => (
          <NavItem
            key={item.id}
            navId={item.id}
            label={item.label}
            order={item.order}
          />
        ))}
      </nav.Context>
    </ul>
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
      if (action.kind === "focus" && !isRefocus(node, action)) {
        const item = items[listPosition - (listPosition % cols)];
        if (item == null) {
          return next();
        }

        try {
          return next(`${node.id}/${item.id}`);
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

  return (
    <div className={css.grid} style={{ "--cols": cols } as CSSProperties}>
      <nav.Context>
        {mapRange(items, gridRange, (item) => {
          const gridPosition = {
            row: Math.floor(item.order / cols),
            col: item.order % cols,
          };

          return (
            <NavItem
              key={item.id}
              navId={item.id}
              label={item.label}
              order={item.order}
              handler={itemHandler().prepend(gridItemHandler(gridPosition))}
            />
          );
        })}
      </nav.Context>
    </div>
  );
}
