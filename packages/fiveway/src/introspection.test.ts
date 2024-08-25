import { expect, test } from "vitest";
import { describeHandler, getHandlerInfo } from "./introspection.ts";
import { createNavigationTree, insertNode } from "./tree.ts";
import { createNode } from "./node.ts";
import { type NavigationHandler } from "./navigation.ts";
import { defaultHandler } from "./handlers/default.ts";

test("handlerInfo", () => {
  const tree = createNavigationTree();

  insertNode(
    tree,
    createNode({
      id: "test",
      parent: "#",
      handler: (_, action, next) => {
        describeHandler(action, { name: "test" });
        return next();
      },
    })
  );

  expect(getHandlerInfo(tree, "#/test")).toEqual([{ name: "test" }]);
});

test("defaultHandlerInfo", () => {
  const tree = createNavigationTree();

  const handlerWithoutInfo: NavigationHandler = (_, action, next) => {
    return next();
  };

  insertNode(
    tree,
    createNode({
      id: "test",
      parent: "#",
      handler: defaultHandler.prepend(handlerWithoutInfo),
    })
  );

  expect(getHandlerInfo(tree, "#/test")).toEqual(
    expect.arrayContaining([{ name: "handlerWithoutInfo" }])
  );
});
