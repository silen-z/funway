import { expect, test } from "vitest";
import { insertNode, createNavigationTree } from "./tree.js";
import { createNode, updateNode } from "./node.js";

test("updateNode correctly sorts children", () => {
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
