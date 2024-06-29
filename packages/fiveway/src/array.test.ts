import { expect, test } from "vitest";
import { binarySearch } from "./array.js";

test("binarySearch works", () => {
  const arr = [1, 3, 4];

  expect(binarySearch(arr, (i) => 2 < i)).toBe(1);
  expect(binarySearch(arr, (i) => 5 < i)).toBe(3);
  expect(binarySearch(arr, (i) => 0 < i)).toBe(0);
  expect(binarySearch(arr, (i) => 3 < i)).toBe(2);
});
