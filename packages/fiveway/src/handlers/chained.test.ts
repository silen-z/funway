import { test, expect } from "vitest";
import { NavigationHandler, runHandler } from "../handler.ts";
import { NodeId } from "../id.ts";
import { createNode } from "../node.ts";
import { createNavigationTree, insertNode } from "../tree.ts";
import { chainedHandler } from "./chained.ts";
import { defaultHandler } from "./default.ts";
import { defineMetadata } from "../metadata";

test("chainedHandler", () => {
  const logs: string[] = [];

  const logHandler =
    (msg: string, pass?: NodeId): NavigationHandler =>
    (n, a, next) => {
      if (a.kind === "select") {
        logs.push(n.id + ":" + msg);
        if (pass) {
          return next(pass);
        }
      }
      return next();
    };

  const testTree = createNavigationTree();

  insertNode(
    testTree,
    createNode({
      id: "node1",
      parent: "#",
      handler: chainedHandler(logHandler("4")).prepend(logHandler("3")),
    })
  );

  const testNode2 = insertNode(
    testTree,
    createNode({
      id: "node2",
      parent: "#",
      handler: chainedHandler(logHandler("2", "#/node1")).prepend(
        logHandler("1")
      ),
    })
  );

  const result = runHandler(testTree, testNode2.id, {
    kind: "select",
  });

  expect(result).toBeNull();
  expect(logs).toEqual(["#/node2:1", "#/node2:2", "#/node1:3", "#/node1:4"]);
});

test("chainedHandler: meta", () => {
  const tree = createNavigationTree();

  const meta = defineMetadata("test");

  const node = insertNode(
    tree,
    createNode({
      id: "node",
      parent: "#",
      handler: defaultHandler.meta(meta, "test-value"),
    })
  );

  const node2 = insertNode(
    tree,
    createNode({
      id: "node2",
      parent: "#",
      handler: defaultHandler.meta(meta, () => "test-value"),
    })
  );

  expect(meta.query(tree, node.id)).toBe("test-value");
  expect(meta.query(tree, node2.id)).toBe("test-value");
});
