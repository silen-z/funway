---
outline: deep
---

# Getting started

Install the core library and frameworks integration:

::: code-group

```sh [React]
npm install @fiveway/core @fiveway/react
```

```sh [SolidJS]
npm install @fiveway/core @fiveway/solid
```

:::

create a navigation tree and provide it to the application

::: code-group

```tsx [React]
import { createNavigationTree } from "@fiveway/core";
import { NavigationProvider, useActionHandler } from "@fiveway/react";

const navtree = createNavigationTree();

function App() {
  // register keyboard listeners (by default on window)
  useActionHandler(navtree);

  return (
    <NavigationProvider tree={navtree}>
      {/* rest of your app */}
    </NavigationProvider>
  );
}

ReactDOM.createRoot(rootElement).render(<App />);
```

:::

now your components can become navigation nodes

::: code-group

```jsx [React]
import { horizontalHandler } from "@fiveway/core";
import { useNavigationNode } from "@fiveway/react";

const items = [
  { id: "1", label: "One" },
  { id: "2", label: "Two" },
  { id: "3", label: "Three" },
];

function List() {
  const nav = useNavigationNode({ id: "list", handler: horizontalHandler });

  return (
    <nav.Context>
      <ul>
        {items.map((item, i) => (
          <Item key={item.id} item={item} order={i} />
        ))}
      </ul>
    </nav.Context>
  );
}

function Item(props) {
  const nav = useNavigationNode({ id: props.item.id, order: props.order });

  return <li className={nav.isFocused() && "focused"}>{props.item.label}</li>;
}
```

:::
