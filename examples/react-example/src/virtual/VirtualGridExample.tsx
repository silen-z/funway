import { type CSSProperties, useState } from "react";
import {
  directChildId,
  gridHandler,
  gridItemHandler,
  itemHandler,
} from "@fiveway/core";
import { useNavigationNode, useOnFocus } from "@fiveway/react";
import css from "./VirtualGridExample.module.css";
import { NavItem } from "../NavItem.tsx";
import { offsetWindow, mapRange } from "./virtual.ts";

const items = [...new Array(42)].map((_, i) => {
  return { id: `item-${i + 1}`, order: i, label: `Item ${i + 1}` };
});

const cols = 4;

export function VirtualGridExample() {
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
      if (action.kind === "focus") {
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
