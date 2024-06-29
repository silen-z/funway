import browser from "webextension-polyfill";

window.addEventListener("message", (event) => {
  // Only accept messages from the same frame
  if (event.source !== window) {
    return;
  }

  const message = event.data;

  // Only accept messages that we know are ours
  if (
    typeof message !== "object" ||
    message === null ||
    message.source !== "fiveway-devtools-extension"
  ) {
    return;
  }

  browser.runtime.sendMessage(message);
});
