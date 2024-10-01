import React from "react";
import ReactDOM from "react-dom/client";
import { createNavigationTree } from "@fiveway/core";
import {
  NavigationProvider,
  useActionHandler,
  useSyncFocus,
} from "@fiveway/react";
import { enableDevtools } from "@fiveway/devtools";
import { Showcase } from "./Showcase.tsx";
import "./styles.css";
// import { Items } from "./Benchmark.tsx";

const navigationTree = createNavigationTree();

enableDevtools(navigationTree);

Object.defineProperties(window, {
  FIVEWAY: { configurable: true, value: navigationTree },
});

function App() {
  useActionHandler(navigationTree);
  useSyncFocus(navigationTree);
  return (
    <NavigationProvider tree={navigationTree}>
      <Showcase />
    </NavigationProvider>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
