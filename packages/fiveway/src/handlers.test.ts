import { describe, expect, test } from "vitest";
import { createNavigationTree } from "./tree.js";
import { createItemNode } from "./node.js";
import { runHandler } from "./handlers/runner.js";
import { chainHandlers, makeHandler } from "./handlers/factory.js";
import { NavigationHandler } from "./handlers/types.js";

describe("handlers", () => {
  test("chainHandlers", () => {
    const logs: string[] = [];

    const logHandler =
      (msg: string): NavigationHandler =>
      (n, a, c, next) => {
        logs.push(msg);
        return next();
      };

    const testHandler = chainHandlers(
      logHandler("handler1"),
      logHandler("handler2"),
      chainHandlers(logHandler("handler3"), logHandler("handler4"))
    );

    const testNode = createItemNode(createNavigationTree(), {
      id: "node1",
      parent: "#",
      handler: testHandler,
    });

    const result = runHandler(testNode, { kind: "move", direction: "right" });

    expect(result).toBeNull();
    expect(logs).toEqual(["handler1", "handler2", "handler3", "handler4"]);
  });

  test("handler.chain", () => {
    const logs: string[] = [];

    const logHandler = (msg: string) =>
      makeHandler((n, a, c, next) => {
        logs.push(msg);
        return next();
      });

    const testHandler = logHandler("handler1")
      .chain(logHandler("handler2"))
      .chain(logHandler("handler3").chain(logHandler("handler4")));

    const testNode = createItemNode(createNavigationTree(), {
      id: "node1",
      parent: "#",
      handler: testHandler,
    });

    const result = runHandler(testNode, { kind: "move", direction: "right" });

    expect(result).toBeNull();
    expect(logs).toEqual(["handler1", "handler2", "handler3", "handler4"]);
  });
});
