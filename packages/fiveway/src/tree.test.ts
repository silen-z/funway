import { expect, test } from "vitest";
import { connectNode, createNavigationTree } from "./tree.js";
import { createNode, updateNode } from "./node.js";

test("updateNode correctly sorts children", () => {
  const tree = createNavigationTree();

  const container = createNode(tree, {
    id: "container",
    parent: "#",
  });
  connectNode(tree, container);

  const node1 = createNode(tree, {
    id: "node1",
    parent: container.id,
  });
  connectNode(tree, node1);

  const node2 = createNode(tree, {
    id: "node2",
    parent: container.id,
  });
  connectNode(tree, node2);

  const node3 = createNode(tree, {
    id: "node3",
    parent: container.id,
  });
  connectNode(tree, node3);

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
