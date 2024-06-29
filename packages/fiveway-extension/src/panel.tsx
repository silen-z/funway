import browser from "webextension-polyfill";
import { render } from "solid-js/web";
import { NavigationTree } from "@fiveway/core";

const backgroundPageConnection = browser.runtime.connect({
  name: "panel",
});

type IncomingMessage = { type: "treeAttached"; tree: NavigationTree };

function isAcceptedMessage(msg: unknown): msg is IncomingMessage {
  return msg != null && typeof msg === "object" && "type" in msg;
}

backgroundPageConnection.onMessage.addListener(
  (message: IncomingMessage | unknown) => {
    if (!isAcceptedMessage(message)) {
      return;
    }

    switch (message.type) {
    }
  },
);

backgroundPageConnection.postMessage({
  name: "init",
  tabId: browser.devtools.inspectedWindow.tabId,
});

function DevTools() {
  return "";
}

render(DevTools, document.getElementById("app")!);
