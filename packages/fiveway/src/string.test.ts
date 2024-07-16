import { expect, test } from "vitest";
import { splitRemainders } from "./string.js";

test("splitLast", () => {
  const result: string[] = [];

  splitRemainders("#/something/a/test", "/", (id) => {
    result.push(id);
  });

  expect(result).toEqual([
    "#/something/a/test",
    "#/something/a",
    "#/something",
    "#",
  ]);
});
