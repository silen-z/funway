export function offsetWindow(
  length: number,
  index: number,
  offsetStart: number,
  offsetEnd = offsetStart,
): [number, number] {
  let start = index - offsetStart;

  let overflow = 0;
  if (start < 0) {
    overflow = -start;
    start = 0;
  }

  let end = index + offsetEnd + overflow;
  if (end > length - 1) {
    start = Math.max(0, start - (end - (length - 1)));
    end = length - 1;
  }

  return [start, end];
}

export function mapRange<T, U>(
  array: T[],
  [start, end]: [number, number],
  mapFn: (e: T) => U,
) {
  const mapped = [];
  for (
    let index = Math.max(start, 0);
    index <= end && index < array.length;
    index++
  ) {
    mapped.push(mapFn(array[index]!));
  }

  return mapped;
}
