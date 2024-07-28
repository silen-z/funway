import { describe, expect, test } from "vitest";
import { connectNode, createNavigationTree } from "./tree.js";
import { NodeId } from "./id.js";
import { createItemNode } from "./node.js";
import { NavigationHandler, chainHandlers, runHandler } from "./handler.js";

describe("handlers", () => {
  test("chainHandlers", () => {
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
    const testNode = createItemNode(testTree, {
      id: "node1",
      parent: "#",
      handler: chainHandlers(logHandler("3"), logHandler("4")),
    });
    connectNode(testTree, testNode);

    const testNode2 = createItemNode(testTree, {
      id: "node2",
      parent: "#",
      handler: chainHandlers(logHandler("1"), logHandler("2", "#/node1")),
    });
    connectNode(testTree, testNode2);

    const result = runHandler(testTree, testNode2.id, {
      kind: "select",
    });

    expect(result).toBeNull();
    expect(logs).toEqual(["#/node2:1", "#/node2:2", "#/node1:3", "#/node1:4"]);
  });
});
