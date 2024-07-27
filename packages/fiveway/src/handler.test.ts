import { describe, expect, test } from "vitest";
import { connectNode, createNavigationTree } from "./tree.js";
import { createItemNode } from "./node.js";
import {
  NavigationHandler,
  makeHandler,
  chainHandlers,
  runHandler,
} from "./handler.js";

describe("handlers", () => {
  test("chainHandlers", () => {
    const logs: string[] = [];

    const logHandler =
      (msg: string): NavigationHandler =>
      (n, a, next) => {
        if (a.kind === "select") {
          logs.push(msg);
        }
        return next();
      };

    const testHandler = chainHandlers(
      logHandler("handler1"),
      logHandler("handler2"),
      chainHandlers(logHandler("handler3"), logHandler("handler4"))
    );

    const testTree = createNavigationTree();
    const testNode = createItemNode(testTree, {
      id: "node1",
      parent: "#",
      handler: testHandler,
    });
    connectNode(testTree, testNode);

    const result = runHandler(testTree, testNode.id, {
      kind: "select",
    });

    expect(result).toBeNull();
    expect(logs).toEqual(["handler1", "handler2", "handler3", "handler4"]);
  });

  test("handler.chain", () => {
    const logs: string[] = [];

    const logHandler = (msg: string) =>
      makeHandler((n, a, next) => {
        if (a.kind === "select") {
          logs.push(msg);
        }
        return next();
      });

    const testHandler = logHandler("handler1")
      .append(logHandler("handler2"))
      .append(logHandler("handler3").append(logHandler("handler4")));

    const testTree = createNavigationTree();
    const testNode = createItemNode(testTree, {
      id: "node1",
      parent: "#",
      handler: testHandler,
    });
    connectNode(testTree, testNode);

    const result = runHandler(testTree, testNode.id, {
      kind: "select",
    });

    expect(result).toBeNull();
    expect(logs).toEqual(["handler1", "handler2", "handler3", "handler4"]);
  });
});
