export function swapRemove(array: unknown[], idx: number) {
  array[idx] = array[array.length - 1];
  array.length -= 1;
}

export function binarySearch<T>(array: T[], pred: (val: T) => boolean) {
  let lo = -1,
    hi = array.length;
  while (1 + lo < hi) {
    const mi = lo + ((hi - lo) >> 1);
    if (pred(array[mi]!)) {
      hi = mi;
    } else {
      lo = mi;
    }
  }
  return hi;
}
