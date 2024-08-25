import { expect, test, vi } from "vitest";
import { registerListener } from "./events";
import {
  createNavigationTree,
  focusNode,
  insertNode,
  isFocused,
} from "./tree.ts";
import { createNode } from "./node.ts";

test("listeners", () => {
  const tree = createNavigationTree();
  insertNode(tree, createNode({ id: "one", parent: "#" }));
  insertNode(tree, createNode({ id: "two", parent: "#" }));

  expect(isFocused(tree, "#/one")).toBe(true);

  const listener1 = vi.fn();
  const cleanupListener1 = registerListener(tree, {
    type: "focuschange",
    node: "#",
    fn: listener1,
  });

  const listener2 = vi.fn();
  const cleanupListener2 = registerListener(tree, {
    type: "focuschange",
    node: "#",
    fn: listener2,
  });

  focusNode(tree, "#/two");

  expect(isFocused(tree, "#/two")).toBe(true);
  expect(listener1).toBeCalledTimes(1);
  expect(listener2).toBeCalledTimes(1);

  cleanupListener1();

  focusNode(tree, "#/one");
  expect(isFocused(tree, "#/one")).toBe(true);
  expect(listener1).toBeCalledTimes(1);
  expect(listener2).toBeCalledTimes(2);

  cleanupListener2();

  focusNode(tree, "#/two");
  expect(isFocused(tree, "#/two")).toBe(true);
  expect(listener1).toBeCalledTimes(1);
  expect(listener2).toBeCalledTimes(2);
});

test("listeners: cleaning listener twice", () => {
  const tree = createNavigationTree();
  const cleanup = registerListener(tree, {
    type: "focuschange",
    node: "#",
    fn: () => {},
  });

  cleanup();
  expect(() => {
    cleanup();
  }).not.toThrow();
});
