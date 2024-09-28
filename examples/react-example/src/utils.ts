export const range = (n: number) => [
  ...(function* () {
    for (let i = 0; i < n; i++) {
      yield i + 1;
    }
  })(),
];
