import { expect, test } from "vitest";
import { connectNode, createNavigationTree } from "./tree.js";
import { createItemNode, updateNode } from "./node.js";

test("updateNode correctly sorts children", () => {
  const tree = createNavigationTree();

  const node1 = createItemNode(tree, {
    id: "node1",
    parent: tree.root.id,
  });
  connectNode(tree, node1);

  const node2 = createItemNode(tree, {
    id: "node2",
    parent: tree.root.id,
  });
  connectNode(tree, node2);

  const node3 = createItemNode(tree, {
    id: "node3",
    parent: tree.root.id,
  });
  connectNode(tree, node3);

  expect(tree.root.children.map((c) => c.id)).toStrictEqual([
    "#/node1",
    "#/node2",
    "#/node3",
  ]);

  updateNode(node2, {
    order: 1,
  });

  expect(tree.root.children.map((c) => c.id)).toStrictEqual([
    "#/node1",
    "#/node3",
    "#/node2",
  ]);

  updateNode(node2, {
    order: -1,
  });

  expect(tree.root.children.map((c) => c.id)).toStrictEqual([
    "#/node2",
    "#/node1",
    "#/node3",
  ]);
});
