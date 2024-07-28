import { expect, test } from "vitest";
import { idsToRoot } from "./id.js";

test("splitLast", () => {
  const result: string[] = [];

  idsToRoot("#/something/a/test", (id) => {
    result.push(id);
  });

  expect(result).toEqual([
    "#/something/a/test",
    "#/something/a",
    "#/something",
    "#",
  ]);
});
