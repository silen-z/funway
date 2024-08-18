/* @refresh reload */
import { render } from "solid-js/web";
import { createNavigationTree } from "@fiveway/core";
import { NavigationProvider, useActionHandler } from "@fiveway/solid";
import { enableDevtools } from "@fiveway/devtools";
import { Showcase } from "./Showcase";

const root = document.getElementById("root");

if (import.meta.env.DEV && !(root instanceof HTMLElement)) {
  throw new Error("Root element not found");
}

const fiveway = createNavigationTree();

enableDevtools(fiveway);

function App() {
  useActionHandler(fiveway);
  return (
    <NavigationProvider tree={fiveway}>
      <Showcase />
    </NavigationProvider>
  );
}

render(App, root!);
