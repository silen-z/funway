import { test, expect } from "vitest";
import {
  createNavigationTree,
  focusNode,
  insertNode,
  isFocused,
  removeNode,
} from "../tree.ts";
import { createNode } from "../node.ts";
import { containerHandler, defaultHandler } from "./default.ts";
import { captureHandler, initialHandler } from "./focus.ts";
import { verticalHandler } from "./directional.ts";
import { handleAction } from "../navigation.ts";

test("focusHandler: items are focusable focus", () => {
  const tree = createNavigationTree();

  const item = insertNode(
    tree,
    createNode({
      id: "item",
      parent: "#",
    })
  );

  expect(isFocused(tree, item.id)).toBe(true);
});

test("focusHandler: skip empty containers", () => {
  const tree = createNavigationTree();

  const container = insertNode(
    tree,
    createNode({
      id: "container",
      parent: "#",
      handler: containerHandler,
    })
  );

  expect(isFocused(tree, container.id)).toBe(false);
});

test("initialHandler: skip empty containers", () => {
  const tree = createNavigationTree();

  const container = insertNode(
    tree,
    createNode({
      id: "container",
      parent: "#",
      handler: verticalHandler.prepend(initialHandler("item2")),
    })
  );

  const item1 = insertNode(
    tree,
    createNode({
      id: "item1",
      parent: container.id,
      handler: defaultHandler,
    })
  );

  expect(tree.focusedId).toBe(item1.id);

  const item2 = insertNode(
    tree,
    createNode({
      id: "item2",
      parent: container.id,
      handler: defaultHandler,
    })
  );

  expect(tree.focusedId).toBe(item2.id);

  const item3 = insertNode(
    tree,
    createNode({
      id: "item3",
      parent: container.id,
      handler: defaultHandler,
    })
  );

  expect(tree.focusedId).toBe(item2.id);

  removeNode(tree, item2.id);

  expect(tree.focusedId).toBe(item1.id);

  handleAction(tree, { kind: "move", direction: "down" });

  expect(tree.focusedId).toBe(item3.id);

  insertNode(tree, item2);

  // initialHandler resets focus back to initial node on insert
  expect(tree.focusedId).toBe(item2.id);
});

test("captureHandler", () => {
  const tree = createNavigationTree();

  const topContainer = insertNode(
    tree,
    createNode({
      id: "topContainer",
      parent: "#",
      handler: verticalHandler,
    })
  );

  const containedList = createNode({
    id: "containedList",
    parent: topContainer.id,
    order: 1,
    handler: verticalHandler.prepend(captureHandler),
  });
  const item1 = createNode({ id: "item1", order: 1, parent: containedList.id });
  const item2 = createNode({ id: "item2", order: 2, parent: containedList.id });

  insertNode(tree, containedList);
  insertNode(tree, item1);
  insertNode(tree, item2);

  const outside = insertNode(
    tree,
    createNode({ id: "outside", order: 2, parent: topContainer.id })
  );

  expect(tree.focusedId).toBe(item1.id);

  handleAction(tree, { kind: "move", direction: "down" });

  expect(tree.focusedId).toBe(item2.id);

  handleAction(tree, { kind: "move", direction: "down" });

  expect(tree.focusedId).toBe(item2.id);

  focusNode(tree, outside.id);

  expect(tree.focusedId).toBe(outside.id);
});
