export function splitRemainders(
  string: string,
  splitter: string,
  cb: (s: string) => boolean | void
) {
  cb(string);

  for (;;) {
    const idx = string.lastIndexOf(splitter);
    if (idx === -1) {
      return;
    }

    string = string.substring(0, idx);
    if (cb(string) === false) {
      return;
    }
  }
}
