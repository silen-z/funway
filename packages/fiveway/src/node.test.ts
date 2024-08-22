import { expect, test } from "vitest";
import { createNavigationTree, insertNode } from "./tree";
import { createNode, updateNode } from "./node";
import { NavigationHandler } from "./handler";
import { defaultHandler } from "./handlers/default";

test("createNode", () => {
  const node = createNode({
    id: "test",
    parent: "#",
  });

  expect(node.id).toBe("#/test");
  expect(node.connected).toBe(false);
  expect(node.handler).toBe(defaultHandler);
  expect(node.children.length).toBe(0);
});

test("updateNode: handler", () => {
  const tree = createNavigationTree();
  const handler1: NavigationHandler = (n, a, next) => next();
  const handler2: NavigationHandler = (n, a, next) => next();
  const node = insertNode(
    tree,
    createNode({
      id: "test",
      parent: "#",
      handler: handler1,
    })
  );

  expect(node.handler).toBe(handler1);

  updateNode(node, { handler: handler2 });

  expect(node.handler).toBe(handler2);
});

test("updateNode: order", () => {
  const tree = createNavigationTree();

  const container = insertNode(
    tree,
    createNode({
      id: "container",
      parent: "#",
    })
  );

  insertNode(
    tree,
    createNode({
      id: "node1",
      parent: container.id,
    })
  );

  const node2 = insertNode(
    tree,
    createNode({
      id: "node2",
      parent: container.id,
    })
  );

  insertNode(
    tree,
    createNode({
      id: "node3",
      parent: container.id,
    })
  );

  expect(container.children.map((c) => c.id)).toStrictEqual([
    "#/container/node1",
    "#/container/node2",
    "#/container/node3",
  ]);

  updateNode(node2, {
    order: 1,
  });

  expect(container.children.map((c) => c.id)).toStrictEqual([
    "#/container/node1",
    "#/container/node3",
    "#/container/node2",
  ]);

  updateNode(node2, {
    order: -1,
  });

  expect(container.children.map((c) => c.id)).toStrictEqual([
    "#/container/node2",
    "#/container/node1",
    "#/container/node3",
  ]);
});

test("updateNode: order on disconnected", () => {
  const node = createNode({
    id: "container",
    parent: "#",
  });

  updateNode(node, { order: 1 });

  expect(node.order).toBe(1);
});

test("updateNode: order when parent is not connected", () => {
  const tree = createNavigationTree();

  const node = insertNode(
    tree,
    createNode({
      id: "test",
      parent: "#/parent",
    })
  );

  updateNode(node, { order: 1 });

  expect(node.order).toBe(1);
});
