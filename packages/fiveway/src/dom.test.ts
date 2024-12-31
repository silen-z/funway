/** @vitest-environment jsdom */
import { test, expect } from "vitest";

// imported from index files otherwise vitest errors on:
// TypeError: defineMetadata is not a function
import {
  createNavigationTree,
  createNode,
  insertNode,
  defaultHandler,
  verticalHandler,
  handleAction,
} from "@fiveway/core";
import { defaultEventMapping } from "@fiveway/core/dom";

test("defaultKeyMapping", async () => {
  expect(defaultEventMapping(new MouseEvent("mouseover"))).toBeNull();

  const tree = createNavigationTree();

  const container = insertNode(
    tree,
    createNode({
      id: "container",
      parent: "#",
      handler: verticalHandler,
    }),
  );

  const item1 = insertNode(
    tree,
    createNode({
      id: "item1",
      parent: container.id,
      handler: defaultHandler,
    }),
  );

  const item2 = insertNode(
    tree,
    createNode({
      id: "item2",
      parent: container.id,
      handler: defaultHandler,
    }),
  );

  expect(tree.focusedId).toBe(item1.id);

  const action = defaultEventMapping(
    new KeyboardEvent("keydown", { key: "ArrowDown" }),
  );
  expect(action).not.toBeNull();
  handleAction(tree, action!);
  expect(tree.focusedId).toBe(item2.id);
});
