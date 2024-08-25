import { test, expect } from "vitest";
import { NavigationHandler, runHandler } from "../navigation.ts";
import { createNode } from "../node.ts";
import { createNavigationTree, insertNode } from "../tree.ts";
import { chainedHandler } from "./chained.ts";
import { defaultHandler } from "./default.ts";
import { defineMetadata } from "../metadata.ts";

test("chainedHandler", () => {
  const tree = createNavigationTree();
  const logs: string[] = [];

  const logHandler =
    (msg: string): NavigationHandler =>
    (n, a, next) => {
      if (a.kind === "query" && a.key === "log") {
        logs.push(n.id + ":" + msg);
      }
      return next();
    };

  const subChain = chainedHandler()
    .prepend(logHandler("4"))
    .prepend(logHandler("3"))
    .prepend(logHandler("2"));

  const handler = chainedHandler()
    .prepend(logHandler("5"))
    .prepend(subChain)
    .prepend(logHandler("1"));

  const node = insertNode(
    tree,
    createNode({ id: "node1", parent: "#", handler: handler })
  );

  const result = runHandler(tree, node.id, {
    kind: "query",
    key: "log",
    value: null,
  });

  expect(result).toBeNull();
  expect(logs).toEqual([
    "#/node1:1",
    "#/node1:2",
    "#/node1:3",
    "#/node1:4",
    "#/node1:5",
  ]);
});

test("chainedHandler: meta", () => {
  const tree = createNavigationTree();

  const meta = defineMetadata("test");

  const node = insertNode(
    tree,
    createNode({
      id: "node",
      parent: "#",
      handler: defaultHandler.prepend(meta.providerHandler("test-value")),
    })
  );

  const node2 = insertNode(
    tree,
    createNode({
      id: "node2",
      parent: "#",
      handler: defaultHandler.prepend(meta.providerHandler(() => "test-value")),
    })
  );

  expect(meta.query(tree, node.id)).toBe("test-value");
  expect(meta.query(tree, node2.id)).toBe("test-value");
});
