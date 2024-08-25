import { expect, test, vi } from "vitest";
import {
  createNavigationTree,
  focusNode,
  insertNode,
  removeNode,
  traverseNodes,
} from "./tree.ts";
import { createNode } from "./node.ts";
import { defaultHandler } from "./handlers/default.ts";
import { selectNode } from "./handlers/select.ts";

test("insertNode", () => {
  const tree = createNavigationTree();
  const node = createNode({
    id: "node",
    parent: "#",
  });

  insertNode(tree, node);

  expect(tree.nodes.get("#/node")).toBeDefined();
  expect(tree.nodes.get("#/node")?.connected).toBe(true);
});

test("insertNode: allow inserting children first", () => {
  const tree = createNavigationTree();

  const container = createNode({
    id: "container",
    parent: "#",
  });

  const item = createNode({
    id: "item",
    parent: container.id,
  });

  insertNode(tree, item);
  insertNode(tree, container);

  expect(container.children.length).toBe(1);
  expect(container.children).toContainEqual({
    id: item.id,
    order: null,
    active: true,
  });
});

test("insertNode: throw on insert root", () => {
  const tree = createNavigationTree();
  const root = tree.nodes.get("#");

  expect(root).toBeDefined();
  expect(() => insertNode(tree, root!)).toThrow();
});

test("insertNode: remember children position", () => {
  const tree = createNavigationTree();
  const root = tree.nodes.get("#")!;

  const node1 = createNode({
    id: "node1",
    parent: "#",
  });

  const node2 = createNode({
    id: "node2",
    parent: "#",
  });

  const node3 = createNode({
    id: "node3",
    parent: "#",
  });

  insertNode(tree, node1);
  insertNode(tree, node2);
  insertNode(tree, node3);

  expect(root.children).toEqual([
    { id: node1.id, active: true, order: null },
    { id: node2.id, active: true, order: null },
    { id: node3.id, active: true, order: null },
  ]);

  removeNode(tree, node2.id);

  expect(root.children).toEqual([
    { id: node1.id, active: true, order: null },
    { id: node2.id, active: false, order: null },
    { id: node3.id, active: true, order: null },
  ]);

  insertNode(tree, node2);

  expect(root.children).toEqual([
    { id: node1.id, active: true, order: null },
    { id: node2.id, active: true, order: null },
    { id: node3.id, active: true, order: null },
  ]);
});

test("removeNode", () => {
  const tree = createNavigationTree();

  const container = createNode({
    id: "container",
    parent: "#",
  });

  const item = createNode({
    id: "item",
    parent: container.id,
  });

  insertNode(tree, container);
  insertNode(tree, item);

  expect(tree.nodes.get(item.id)).toBeDefined();
  expect(tree.nodes.get(item.id)?.connected).toBe(true);

  removeNode(tree, container.id);

  expect(tree.nodes.get(container.id)).toBeUndefined();
  expect(tree.nodes.get(item.id)?.connected).toBe(false);

  expect(() => removeNode(tree, container.id)).not.toThrow();

  removeNode(tree, item.id);
});

test("removeNode: remembered children", () => {
  const tree = createNavigationTree();
  const root = tree.nodes.get("#")!;

  const orderedItem = createNode({
    id: "orderedItem",
    parent: "#",
    order: 1,
  });

  const unorderedItem = createNode({
    id: "unorderedItem",
    parent: "#",
  });

  insertNode(tree, orderedItem);
  insertNode(tree, unorderedItem);

  expect(root.children).toEqual([
    { id: unorderedItem.id, active: true, order: null },
    { id: orderedItem.id, active: true, order: 1 },
  ]);

  removeNode(tree, orderedItem.id);
  removeNode(tree, unorderedItem.id);

  expect(root.children).toEqual([
    { id: unorderedItem.id, active: false, order: null },
  ]);
});

test("focusNode", () => {
  const tree = createNavigationTree();

  const node1 = createNode({
    id: "node1",
    parent: "#",
  });

  const node2 = createNode({
    id: "node2",
    parent: "#",
  });

  insertNode(tree, node1);
  insertNode(tree, node2);

  expect(tree.focusedId).toBe(node1.id);

  focusNode(tree, node2.id);

  expect(tree.focusedId).toBe(node2.id);

  const success = focusNode(tree, "#/non-existent");
  expect(success).toBe(false);
  expect(tree.focusedId).toBe(node2.id);
});

test("selectNode", () => {
  const tree = createNavigationTree();

  const parkingNode = createNode({
    id: "parkingNode",
    parent: "#",
  });

  const onSelect = vi.fn();

  const targetNode = createNode({
    id: "node",
    parent: "#",
    handler: defaultHandler.onSelect(onSelect),
  });

  insertNode(tree, parkingNode);
  insertNode(tree, targetNode);

  expect(tree.focusedId).toBe(parkingNode.id);

  selectNode(tree, targetNode.id);

  expect(onSelect).toBeCalledTimes(1);
  expect(tree.focusedId).toBe(targetNode.id);
});

test("traverseNodes", () => {
  const tree = createNavigationTree();

  const container1 = insertNode(
    tree,
    createNode({
      id: "container1",
      parent: "#",
    })
  );

  const item1 = insertNode(
    tree,
    createNode({
      id: "item1",
      parent: container1.id,
    })
  );

  const item2 = insertNode(
    tree,
    createNode({
      id: "item2",
      parent: container1.id,
    })
  );

  const container2 = insertNode(
    tree,
    createNode({
      id: "container2",
      parent: "#",
    })
  );

  const item3 = insertNode(
    tree,
    createNode({
      id: "item3",
      parent: container2.id,
    })
  );

  const item4 = insertNode(
    tree,
    createNode({
      id: "item4",
      parent: container2.id,
    })
  );

  const result: string[] = [];
  traverseNodes(tree, "#", null, (id) => {
    result.push(id);
  });

  expect(result).toContain(container1.id);
  expect(result).toContain(container2.id);
  expect(result).toContain(item1.id);
  expect(result).toContain(item2.id);
  expect(result).toContain(item3.id);
  expect(result).toContain(item4.id);

  const shallowResult: string[] = [];
  traverseNodes(tree, "#", 1, (id) => {
    shallowResult.push(id);
  });

  expect(shallowResult).toContain(container1.id);
  expect(shallowResult).toContain(container2.id);
});
