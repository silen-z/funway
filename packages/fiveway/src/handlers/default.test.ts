import { test, expect } from "vitest";
import { createNavigationTree, insertNode } from "../tree";
import { createNode } from "../node";
import { getHandlerInfo } from "../introspection";
import { containerHandler } from "./default";
import { defineMetadata } from "../metadata";

test("defaultHandler", () => {
  const tree = createNavigationTree();

  const container = insertNode(
    tree,
    createNode({
      id: "test",
      parent: "#",
      handler: containerHandler,
    })
  );

  const item = insertNode(
    tree,
    createNode({
      id: "test",
      parent: container.id,
    })
  );

  expect(getHandlerInfo(tree, container.id)).toEqual([
    { name: "core:focus", skipEmpty: true },
    { name: "core:parent" },
  ]);

  expect(getHandlerInfo(tree, item.id)).toEqual([
    { name: "core:focus", skipEmpty: false },
    { name: "core:parent" },
  ]);
});

test("defaultHandler: don't look for metadata in parent", () => {
  const tree = createNavigationTree();
  const meta = defineMetadata("test");

  const container = insertNode(
    tree,
    createNode({
      id: "test",
      parent: "#",
      handler: containerHandler.meta(meta, 1),
    })
  );

  const item = insertNode(
    tree,
    createNode({
      id: "test",
      parent: container.id,
    })
  );

  expect(meta.query(tree, item.id)).toBeNull();
});
