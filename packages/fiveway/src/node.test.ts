import { describe, expect, test } from "vitest";
import { connectNode, createNavigationTree } from "./tree.js";
import { createContainerNode, createItemNode } from "./node.js";
import { childrenIterator } from "./children.js";

describe("node", () => {
  const tree = createNavigationTree();

  const container = createContainerNode(tree, {
    id: "container",
    parent: "#",
    initial: "node2",
  });
  connectNode(tree, container);

  const node1 = createItemNode(tree, {
    id: "node1",
    parent: container.id,
  });
  connectNode(tree, node1);

  const node2 = createItemNode(tree, {
    id: "node2",
    parent: container.id,
  });
  connectNode(tree, node2);

  const node3 = createItemNode(tree, {
    id: "node3",
    parent: container.id,
  });
  connectNode(tree, node3);

  test("childrenIterator: default", () => {
    const iterated: string[] = [];
    for (const child of childrenIterator(container)) {
      iterated.push(child.id);
    }

    expect(iterated).toEqual([node2.id, node1.id, node3.id]);
  });

  test("childrenIterator: front", () => {
    const iterated: string[] = [];
    for (const child of childrenIterator(container, "front")) {
      iterated.push(child.id);
    }

    expect(iterated).toEqual([node1.id, node2.id, node3.id]);
  });

  test("childrenIterator: back", () => {
    const iterated: string[] = [];
    for (const child of childrenIterator(container, "back")) {
      iterated.push(child.id);
    }

    expect(iterated).toEqual([node3.id, node2.id, node1.id]);
  });
});
