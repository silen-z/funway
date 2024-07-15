import React from "react";
import ReactDOM from "react-dom/client";
import { createNavigationTree } from "@fiveway/core";
import { NavigationProvider } from "@fiveway/react";
import { Showcase } from "./Showcase.tsx";

const navigationTree = createNavigationTree();

Object.defineProperties(window, {
  NAVTREE: { value: navigationTree },
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <NavigationProvider tree={navigationTree}>
      <Showcase />
    </NavigationProvider>
  </React.StrictMode>
);
