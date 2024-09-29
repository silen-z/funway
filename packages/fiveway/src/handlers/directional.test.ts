import { test, expect } from "vitest";
import { handleAction } from "../navigation.ts";
import { horizontalHandler, verticalHandler } from "./directional.ts";
import { createNode } from "../node.ts";
import {
  createNavigationTree,
  insertNode,
  removeNode,
  resolveFocus,
} from "../tree.ts";

test("verticalHandler", async () => {
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
    }),
  );

  const item2 = insertNode(
    tree,
    createNode({
      id: "item2",
      parent: container.id,
    }),
  );

  expect(await resolveFocus(tree)).toBe(item1.id);

  handleAction(tree, { kind: "move", direction: "down" });

  expect(await resolveFocus(tree)).toBe(item2.id);

  handleAction(tree, { kind: "move", direction: "up" });

  expect(await resolveFocus(tree)).toBe(item1.id);
});

test("verticalHandler: wrong direction", async () => {
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
    createNode({ id: "item1", parent: container.id }),
  );

  insertNode(tree, createNode({ id: "item2", parent: container.id }));

  expect(await resolveFocus(tree)).toBe(item1.id);

  handleAction(tree, { kind: "move", direction: "up" });

  expect(await resolveFocus(tree)).toBe(item1.id);

  handleAction(tree, { kind: "move", direction: "left" });

  expect(await resolveFocus(tree)).toBe(item1.id);

  handleAction(tree, { kind: "move", direction: "right" });

  expect(await resolveFocus(tree)).toBe(item1.id);
});

test("verticalHandler: skip removed", async () => {
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
    }),
  );

  const item2 = insertNode(
    tree,
    createNode({
      id: "item2",
      parent: container.id,
    }),
  );

  const item3 = insertNode(
    tree,
    createNode({
      id: "item3",
      parent: container.id,
    }),
  );

  removeNode(tree, item2.id);

  expect(await resolveFocus(tree)).toBe(item1.id);

  handleAction(tree, { kind: "move", direction: "down" });

  expect(await resolveFocus(tree)).toBe(item3.id);

  handleAction(tree, { kind: "move", direction: "up" });

  expect(await resolveFocus(tree)).toBe(item1.id);
});

test("verticalHandler: focus direction", async () => {
  const tree = createNavigationTree();

  const container = insertNode(
    tree,
    createNode({
      id: "container",
      parent: "#",
      handler: verticalHandler,
    }),
  );

  const list = insertNode(
    tree,
    createNode({
      id: "list",
      parent: container.id,
      handler: verticalHandler,
    }),
  );

  const item1 = insertNode(
    tree,
    createNode({
      id: "item1",
      parent: list.id,
    }),
  );

  const item2 = insertNode(
    tree,
    createNode({
      id: "item2",
      parent: list.id,
    }),
  );

  const outside = insertNode(
    tree,
    createNode({
      id: "outside",
      parent: container.id,
    }),
  );

  expect(await resolveFocus(tree)).toBe(item1.id);

  handleAction(tree, { kind: "move", direction: "down" });
  handleAction(tree, { kind: "move", direction: "down" });

  expect(await resolveFocus(tree)).toBe(outside.id);

  handleAction(tree, { kind: "move", direction: "up" });

  expect(await resolveFocus(tree)).toBe(item2.id);
});

test("horizontalHandler", async () => {
  const tree = createNavigationTree();

  const container = insertNode(
    tree,
    createNode({
      id: "container",
      parent: "#",
      handler: horizontalHandler,
    }),
  );

  const item1 = insertNode(
    tree,
    createNode({
      id: "item1",
      parent: container.id,
    }),
  );

  const item2 = insertNode(
    tree,
    createNode({
      id: "item2",
      parent: container.id,
    }),
  );

  expect(await resolveFocus(tree)).toBe(item1.id);

  handleAction(tree, { kind: "move", direction: "right" });

  expect(await resolveFocus(tree)).toBe(item2.id);

  handleAction(tree, { kind: "move", direction: "left" });

  expect(await resolveFocus(tree)).toBe(item1.id);
});

test("horizontalHandler: wrong direction", async () => {
  const tree = createNavigationTree();

  const container = insertNode(
    tree,
    createNode({
      id: "container",
      parent: "#",
      handler: horizontalHandler,
    }),
  );

  const item1 = insertNode(
    tree,
    createNode({ id: "item1", parent: container.id }),
  );

  insertNode(tree, createNode({ id: "item2", parent: container.id }));

  expect(await resolveFocus(tree)).toBe(item1.id);

  handleAction(tree, { kind: "move", direction: "left" });

  expect(await resolveFocus(tree)).toBe(item1.id);

  handleAction(tree, { kind: "move", direction: "down" });

  expect(await resolveFocus(tree)).toBe(item1.id);

  handleAction(tree, { kind: "move", direction: "up" });

  expect(await resolveFocus(tree)).toBe(item1.id);
});

test("horizontalHandler: focus direction", async () => {
  const tree = createNavigationTree();

  const container = insertNode(
    tree,
    createNode({
      id: "container",
      parent: "#",
      handler: horizontalHandler,
    }),
  );

  const list = insertNode(
    tree,
    createNode({
      id: "list",
      parent: container.id,
      handler: horizontalHandler,
    }),
  );

  const item1 = insertNode(
    tree,
    createNode({
      id: "item1",
      parent: list.id,
    }),
  );

  const item2 = insertNode(
    tree,
    createNode({
      id: "item2",
      parent: list.id,
    }),
  );

  const outside = insertNode(
    tree,
    createNode({
      id: "outside",
      parent: container.id,
    }),
  );

  expect(await resolveFocus(tree)).toBe(item1.id);

  handleAction(tree, { kind: "move", direction: "right" });
  handleAction(tree, { kind: "move", direction: "right" });

  expect(await resolveFocus(tree)).toBe(outside.id);

  handleAction(tree, { kind: "move", direction: "left" });

  expect(await resolveFocus(tree)).toBe(item2.id);
});

test("horizontal: skip removed", async () => {
  const tree = createNavigationTree();

  const container = insertNode(
    tree,
    createNode({
      id: "container",
      parent: "#",
      handler: horizontalHandler,
    }),
  );

  const item1 = insertNode(
    tree,
    createNode({
      id: "item1",
      parent: container.id,
    }),
  );

  const item2 = insertNode(
    tree,
    createNode({
      id: "item2",
      parent: container.id,
    }),
  );

  const item3 = insertNode(
    tree,
    createNode({
      id: "item3",
      parent: container.id,
    }),
  );

  removeNode(tree, item2.id);

  expect(await resolveFocus(tree)).toBe(item1.id);

  handleAction(tree, { kind: "move", direction: "right" });

  expect(await resolveFocus(tree)).toBe(item3.id);

  handleAction(tree, { kind: "move", direction: "left" });

  expect(await resolveFocus(tree)).toBe(item1.id);
});
