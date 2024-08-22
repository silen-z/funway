import { expect, test } from "vitest";
import { swapRemove, binarySearch } from "./array.js";

test("swapRemove", () => {
  const arr = [1, 2, 3, 4];

  swapRemove(arr, 1);

  expect(arr).toEqual([1, 4, 3]);
});

test("swapRemove: from start", () => {
  const arr = [1, 2, 3, 4];

  swapRemove(arr, 0);

  expect(arr).toEqual([4, 2, 3]);
});

test("swapRemove: from end", () => {
  const arr = [1, 2, 3, 4];

  swapRemove(arr, 3);

  expect(arr).toEqual([1, 2, 3]);
});

test("swapRemove: out of bounds", () => {
  const arr = [1, 2, 3, 4];

  swapRemove(arr, 10);

  expect(arr).toEqual([1, 2, 3, 4]);
});

test("binarySearch: search", () => {
  const arr = [1, 3, 4];

  expect(binarySearch(arr, (i) => 2 < i)).toBe(1);
  expect(binarySearch(arr, (i) => 5 < i)).toBe(3);
  expect(binarySearch(arr, (i) => 0 < i)).toBe(0);
  expect(binarySearch(arr, (i) => 3 < i)).toBe(2);
});

test("binarySearch: insert", () => {
  const arr = [1, 3, 4];
  const toInsert = 2;

  const index = binarySearch(arr, (i) => toInsert < i);
  arr.splice(index, 0, toInsert);

  expect(arr).toEqual([1, 2, 3, 4]);
});
