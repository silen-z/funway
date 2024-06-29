import { NavigationTree, addEventListener } from "@fiveway/core";

export type fivewayHook = {
  register(tree: NavigationTree): void;
};

declare global {
  interface Window {
    __fiveway_DEVTOOLS__?: fivewayHook;
  }
}

if (window.__fiveway_DEVTOOLS__ == null) {
  window.__fiveway_DEVTOOLS__ = {
    register(tree: NavigationTree) {
      addEventListener(tree, "*", tree.root, (event) => {
        window.postMessage(
          {
            source: "fiveway-devtools-extension",
            type: "update-tree",
            event,
          },
          "*",
        );
      });

      window.postMessage(
        {
          source: "fiveway-devtools-extension",
          type: "register-tree",
          tree,
        },
        "*",
      );
    },
  };
}
