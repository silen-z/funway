/* @refresh reload */
import { render } from "solid-js/web";
import { NavigationProvider } from "@fiveway/solid";

import { Showcase } from "./Showcase";
import { createNavigationTree } from "@fiveway/core";

const root = document.getElementById("root");

if (import.meta.env.DEV && !(root instanceof HTMLElement)) {
  throw new Error(
    "Root element not found. Did you forget to add it to your index.html? Or maybe the id attribute got misspelled?"
  );
}

const fiveway = createNavigationTree();

render(
  () => (
    <NavigationProvider tree={fiveway}>
      <Showcase />
    </NavigationProvider>
  ),

  root!
);
