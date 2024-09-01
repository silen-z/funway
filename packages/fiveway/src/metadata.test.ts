import { test, expect } from "vitest";
import { containerHandler } from "./handlers/default.ts";
import { defineMetadata } from "./metadata.ts";
import { createNode } from "./node.ts";
import { createNavigationTree, insertNode } from "./tree.ts";

test("don't look for metadata in parent", () => {
  const tree = createNavigationTree();
  const meta = defineMetadata("test");

  const container = insertNode(
    tree,
    createNode({
      id: "test",
      parent: "#",
      handler: containerHandler.prepend(meta.providerHandler(1)),
    }),
  );

  const item = insertNode(
    tree,
    createNode({
      id: "test",
      parent: container.id,
    }),
  );

  expect(meta.query(tree, item.id)).toBeNull();
});
