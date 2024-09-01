import { expect, test } from "vitest";
import { gridHandler, gridItemHandler } from "./grid.ts";
import { handleAction } from "../navigation.ts";
import { createNode } from "../node.ts";
import { createNavigationTree, insertNode, removeNode } from "../tree.ts";
import { defaultHandler } from "./default.ts";

test("gridHandler", () => {
  const tree = createNavigationTree();

  const container = insertNode(
    tree,
    createNode({
      id: "grid",
      parent: "#",
      handler: gridHandler,
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

  expect(tree.focusedId).toBe("#/grid/item-1-1");

  handleAction(tree, { kind: "move", direction: "right" });

  expect(tree.focusedId).toBe("#/grid/item-1-2");

  handleAction(tree, { kind: "move", direction: "down" });

  expect(tree.focusedId).toBe("#/grid/item-3-2");

  handleAction(tree, { kind: "move", direction: "right" });

  expect(tree.focusedId).toBe("#/grid/item-3-3");

  handleAction(tree, { kind: "move", direction: "up" });

  expect(tree.focusedId).toBe("#/grid/item-2-3");

  handleAction(tree, { kind: "move", direction: "left" });

  expect(tree.focusedId).toBe("#/grid/item-2-1");

  handleAction(tree, { kind: "move", direction: "up" });

  expect(tree.focusedId).toBe("#/grid/item-1-1");

  handleAction(tree, { kind: "move", direction: "left" });

  expect(tree.focusedId).toBe("#/grid/item-1-1");
});
