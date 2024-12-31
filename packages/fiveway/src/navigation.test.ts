import { expect, test, vi } from "vitest";
import { insertNode, createNavigationTree } from "./tree.ts";
import { createNode } from "./node.ts";
import { type NavigationHandler } from "./navigation.ts";

test("runHandler", async () => {
  const tree = createNavigationTree();

  const handler = vi.fn(() => null);
  insertNode(tree, createNode({ id: "one", parent: "#", handler }));

  expect(handler).toHaveBeenCalledWith(
    expect.objectContaining({ id: "#/one" }),
    expect.objectContaining({ kind: "focus" }),
    expect.any(Function),
  );
});

test("runHandler: pass action to non-existent node", () => {
  const tree = createNavigationTree();

  const handler: NavigationHandler = (n, a, next) => {
    const nextId = next("#/non-existent");
    expect(nextId).toBeNull();
    return nextId;
  };
  insertNode(tree, createNode({ id: "one", parent: "#", handler }));
});
