import { test, expect } from "vitest";
import { createNavigationTree, insertNode } from "../tree.ts";
import { createNode } from "../node.ts";
import { getHandlerInfo } from "../introspection.ts";
import { containerHandler } from "./default.ts";

test("defaultHandler", () => {
  const tree = createNavigationTree();

  const container = insertNode(
    tree,
    createNode({
      id: "test",
      parent: "#",
      handler: containerHandler,
    }),
  );

  const item = insertNode(
    tree,
    createNode({
      id: "test",
      parent: container.id,
    }),
  );

  expect(getHandlerInfo(tree, container.id)).toEqual([
    { name: "core:focus", skipEmpty: true, direction: "default" },
    { name: "core:parent" },
  ]);

  expect(getHandlerInfo(tree, item.id)).toEqual([
    { name: "core:focus", skipEmpty: false, direction: "default" },
    { name: "core:parent" },
  ]);
});
