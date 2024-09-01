import { test, expect, vi } from "vitest";
import { createNavigationTree, insertNode } from "../tree.ts";
import { createNode } from "../node.ts";
import { defaultHandler } from "./default.ts";
import { selectHandler } from "./select.ts";
import { handleAction } from "../navigation.ts";

test("selectHandler", () => {
  const tree = createNavigationTree();

  const onSelect = vi.fn();
  const node = insertNode(
    tree,
    createNode({
      id: "test",
      parent: "#",
      handler: defaultHandler.prepend(selectHandler(onSelect)),
    }),
  );

  expect(tree.focusedId).toBe(node.id);

  handleAction(tree, { kind: "select" });

  expect(onSelect).toBeCalledTimes(1);
});
