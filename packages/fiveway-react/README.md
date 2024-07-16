# fiveway

TypeScript library for keyboard navigation.

### Features

 - **configurable** - pick focus handler for your specific use-case, attach callbacks, enable/disable nodes, specify order and capture focus inside specific nodes

 - **extensible** - handlers are designed to be further extended and chained together via sofisticated middleware system

 - **framework agnostic** - seamlesly and consistently usable in any framework and even works across different ones at the same time 

 - **robust** - consistent with predictable defaults, tries its hardest to not lose focus, works with framework lifecycles and hot-module-reloading

 - **performance** - performant while not sacrificing functionality and maintainability


## @fiveway/react

### Getting started

Install the core library and React integration:

```
npm install @fiveway/core @fiveway/react
```

create a navigation tree and provide it to the application

```typescript
import { createNavigationTree } from "@fiveway/core";
import { NavigationProvider } from "@fiveway/react";

const navtree = createNavigationTree();

ReactDOM.createRoot(rootElement).render(
  <NavigationProvider tree={navigationTree}>
    <YourApp />
  </NavigationProvider>
);
```

now your components can become navigation nodes

```typescript
import { horizontalList } from "@fiveway/core";
import { useNavigationContainer, useNavigationItem } from "@fiveway/react";

const items = [
  { id: "1", label: "One" },
  { id: "2", label: "Two" },
  { id: "3", label: "Three" },
];

function List() {
  const navNode = useNavigationContainer({
    id: "list",
    handler: horizontalList,
  });

  return (
    <navNode.Context>
      <ul>
        {items.map((item, i) => (
          <Item key={item.id} item={item} order={i} />
        ))}
      </ul>
    </navNode.Context>
  );
}

function Item(props) {
  const navNode = useNavigationContainer({
    id: props.item.id,
    order: props.order,
  });

  return (
    <li className={navNode.isFocused() && "focused"}>{props.item.label}</li>
  );
}
```

full example at: https://github.com/silen-z/fiveway/tree/main/examples/react-example