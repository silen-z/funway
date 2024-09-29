import { expect, test } from "vitest";
import { gridHandler, gridItemHandler } from "./grid.ts";
import { handleAction } from "../navigation.ts";
import { createNode } from "../node.ts";
import {
  createNavigationTree,
  insertNode,
  removeNode,
  resolveFocus,
} from "../tree.ts";
import { defaultHandler } from "./default.ts";

test("gridHandler", async () => {
  const tree = createNavigationTree();

  const container = insertNode(
    tree,
    createNode({
      id: "grid",
      parent: "#",
      handler: gridHandler(),
    }),
  );

  for (let row = 1; row <= 3; row++) {
    for (let col = 1; col <= 3; col++) {
      insertNode(
        tree,
        createNode({
          id: `item-${row}-${col}`,
          parent: container.id,
          handler: defaultHandler.prepend(gridItemHandler({ row, col })),
        }),
      );
    }
  }

  removeNode(tree, "#/grid/item-2-2");
  removeNode(tree, "#/grid/item-3-3");

  expect(await resolveFocus(tree)).toBe("#/grid/item-1-1");

  handleAction(tree, { kind: "move", direction: "down" });

  expect(await resolveFocus(tree)).toBe("#/grid/item-2-1");

  handleAction(tree, { kind: "move", direction: "down" });

  expect(await resolveFocus(tree)).toBe("#/grid/item-3-1");

  handleAction(tree, { kind: "move", direction: "right" });

  expect(await resolveFocus(tree)).toBe("#/grid/item-3-2");

  handleAction(tree, { kind: "move", direction: "up" });

  expect(await resolveFocus(tree)).toBe("#/grid/item-2-3");

  handleAction(tree, { kind: "move", direction: "right" });

  expect(await resolveFocus(tree)).toBe("#/grid/item-2-3");

  handleAction(tree, { kind: "move", direction: "left" });

  expect(await resolveFocus(tree)).toBe("#/grid/item-1-2");

  handleAction(tree, { kind: "move", direction: "down" });

  expect(await resolveFocus(tree)).toBe("#/grid/item-2-1");

  handleAction(tree, { kind: "move", direction: "right" });

  expect(await resolveFocus(tree)).toBe("#/grid/item-3-2");

  handleAction(tree, { kind: "move", direction: "up" });

  expect(await resolveFocus(tree)).toBe("#/grid/item-2-3");

  handleAction(tree, { kind: "move", direction: "down" });

  expect(await resolveFocus(tree)).toBe("#/grid/item-3-2");
});
