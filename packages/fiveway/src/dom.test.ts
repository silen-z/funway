/** @vitest-environment jsdom */
import { test, expect } from "vitest";
import { defaultEventMapping } from "./dom.ts";
import { handleAction } from "./navigation.ts";
import { defaultHandler } from "./handlers/default.ts";
import { verticalHandler } from "./handlers/directional.ts";
import { createNode } from "./node.ts";
import { createNavigationTree, insertNode } from "./tree.ts";

test("defaultKeyMapping", () => {
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
