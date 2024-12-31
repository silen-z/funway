/* @refresh reload */
import { render } from "solid-js/web";
import { createNavigationTree } from "@fiveway/core";
import { createActionHandler, NavigationProvider } from "@fiveway/solid";
import { enableDevtools } from "@fiveway/devtools";
import { Showcase } from "./Showcase.tsx";

const root = document.getElementById("root");

if (import.meta.env.DEV && !(root instanceof HTMLElement)) {
  throw new Error("Root element not found");
}

const fiveway = createNavigationTree();

Object.defineProperties(window, {
  FIVEWAY: { configurable: true, value: fiveway },
});

enableDevtools(fiveway);

function App() {
  createActionHandler(fiveway);
  return (
    <NavigationProvider tree={fiveway}>
      <Showcase />
    </NavigationProvider>
  );
}

render(App, root!);
