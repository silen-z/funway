import { expect, test, vi } from "vitest";
import {
  convergingPaths,
  createGlobalId,
  directChildId,
  idsToRoot,
  isParent,
  scopedId,
} from "./id.ts";

test("createGlobalId", () => {
  expect(createGlobalId("#/container", "item")).toBe("#/container/item");
});

test("scopedId", () => {
  expect(scopedId("#/container", "item")).toBe("#/container/item");
  expect(scopedId("#/container", "#/item")).toBe("#/item");
});

test("isParent", () => {
  expect(isParent("#", "#/item")).toBe(true);
  expect(isParent("#/one", "#/two/item")).toBe(false);
  expect(isParent("#/container", "#/container/item")).toBe(true);

  expect(isParent("#/container", "#/containeritem")).toBe(false);
  expect(isParent("#/container", "#/containeri")).toBe(false);
});

test("directChildId", () => {
  expect(directChildId("#/container", "#/container/item/nested")).toBe(
    "#/container/item"
  );
  expect(directChildId("#/container", "#/container/item")).toBe(
    "#/container/item"
  );
  expect(directChildId("#/container", "#/another/item/nested")).toBeNull();
});

test("idsToRoot", () => {
  const callback = vi.fn();

  idsToRoot("#/something/a/test", callback);

  expect(callback).toHaveBeenCalledTimes(4);
  expect(callback).toHaveBeenNthCalledWith(1, "#/something/a/test");
  expect(callback).toHaveBeenNthCalledWith(2, "#/something/a");
  expect(callback).toHaveBeenNthCalledWith(3, "#/something");
  expect(callback).toHaveBeenNthCalledWith(4, "#");
});

test("idsToRoot: stop on false", () => {
  const callback = vi.fn((id) => {
    if (id === "#/something") {
      return false;
    }
  });

  idsToRoot("#/something/a/test", callback);

  expect(callback).toHaveBeenCalledTimes(3);
});

test("idsToRoot", () => {
  const callback = vi.fn();

  convergingPaths(
    "#/shared/another-shared/item1",
    "#/shared/another-shared/container/item2",
    callback
  );

  expect(callback).toHaveBeenCalledTimes(6);
  expect(callback).toHaveBeenCalledWith(
    "#/shared/another-shared/container/item2"
  );
  expect(callback).toHaveBeenCalledWith("#/shared/another-shared/container");
  expect(callback).toHaveBeenCalledWith("#/shared/another-shared/item1");
  expect(callback).toHaveBeenCalledWith("#/shared/another-shared");
  expect(callback).toHaveBeenCalledWith("#/shared");
  expect(callback).toHaveBeenCalledWith("#");
});
