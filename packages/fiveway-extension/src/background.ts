import browser from "webextension-polyfill";

async function injectHook() {
  await browser.scripting.registerContentScripts([
    {
      id: "@react-devtools/hook",
      js: ["./src/hook.js"],
      matches: ["<all_urls>"],
      persistAcrossSessions: true,
      runAt: "document_start",
      // @ts-expect-error ExecutionWorld is not yet supported by Firefox
      world: "MAIN",
    },
  ]);
}

injectHook();

// background.js
const connections: Record<string, browser.Runtime.Port> = {};

type Message = {
  name: "init";
  tabId: string;
};

browser.runtime.onConnect.addListener((port) => {
  const extensionListener = (message: Message) => {
    // The original connection event doesn't include the tab ID of the
    // DevTools page, so we need to send it explicitly.
    if (message.name === "init") {
      connections[message.tabId] = port;
      return;
    }

    // other message handling
  };

  // Listen to messages sent from the DevTools page
  port.onMessage.addListener(extensionListener);

  port.onDisconnect.addListener((port) => {
    port.onMessage.removeListener(extensionListener);

    const tabs = Object.keys(connections);
    for (let i = 0, len = tabs.length; i < len; i++) {
      if (connections[tabs[i]] == port) {
        delete connections[tabs[i]];
        break;
      }
    }
  });
});

// Receive message from content script and relay to the devTools page for the
// current tab
browser.runtime.onMessage.addListener((request: unknown, sender) => {
  // Messages from content scripts should have sender.tab set
  if (sender.tab) {
    const tabId = sender.tab.id;
    if (tabId != null && tabId in connections) {
      connections[tabId].postMessage(request);
    } else {
      console.log("Tab not found in connection list.");
    }
  } else {
    console.log("sender.tab not defined.");
  }
  return true;
});
