/**
 * Removes element from an array by moving the last one in its place and truncating it
 * It's potentionaly faster becase it doesn't have to shift the rest of elements
 */
export function swapRemove(array: unknown[], idx: number) {
  array[idx] = array[array.length - 1];
  array.length -= 1;
}

/**
 * Searches through ordered array for a element matching the predicate
 * @returns index of
 */
export function binarySearch<T>(array: T[], pred: (val: T) => boolean) {
  let low = -1;
  let high = array.length;

  while (low + 1 < high) {
    const mid = low + ((high - low) >> 1);

    if (pred(array[mid]!)) {
      high = mid;
    } else {
      low = mid;
    }
  }

  return high;
}
