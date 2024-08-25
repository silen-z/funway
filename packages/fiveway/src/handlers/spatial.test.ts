import { expect, test } from "vitest";
import { spatialHandler, NodePosition } from "./spatial.ts";
import { handleAction } from "../navigation.ts";
import { createNode } from "../node.ts";
import { createNavigationTree, insertNode, removeNode } from "../tree.ts";
import { defaultHandler } from "./default.ts";

test("spatialHandler", () => {
  const tree = createNavigationTree();

  const container = insertNode(
    tree,
    createNode({
      id: "spatial",
      parent: "#",
      handler: spatialHandler,
    })
  );

  for (let row = 1; row <= 2; row++) {
    for (let col = 1; col <= 2; col++) {
      const position = NodePosition.providerHandler(() => {
        return {
          top: row * 100,
          y: row * 100,
          bottom: row * 100 + 10,

          left: col * 100,
          x: col * 100,
          right: col * 100 + 10,

          width: 10,
          height: 10,
          toJSON: () => null,
        };
      });

      insertNode(
        tree,
        createNode({
          id: `item-${row}-${col}`,
          parent: container.id,
          handler: defaultHandler.prepend(position),
        })
      );
    }
  }

  removeNode(tree, "#/spatial/item-2-2");

  expect(tree.focusedId).toBe("#/spatial/item-1-1");

  handleAction(tree, { kind: "move", direction: "right" });

  expect(tree.focusedId).toBe("#/spatial/item-1-2");

  handleAction(tree, { kind: "move", direction: "down" });

  expect(tree.focusedId).toBe("#/spatial/item-2-1");

  handleAction(tree, { kind: "move", direction: "up" });

  expect(tree.focusedId).toBe("#/spatial/item-1-1");

  handleAction(tree, { kind: "move", direction: "right" });

  expect(tree.focusedId).toBe("#/spatial/item-1-2");

  handleAction(tree, { kind: "move", direction: "left" });

  expect(tree.focusedId).toBe("#/spatial/item-1-1");
});
