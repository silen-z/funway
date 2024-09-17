# What is fiveway?

**fiveway** is a TypeScript library for rich web applications that want to
support keyboard navigation and have absolute control over what is focused.
It comes with a set of default behaviors and allows for extensive customization.

fiveway is designed to be used with component-based UI frameworks such as React, SolidJS, Vue, Svelte and others.
For now it provides first-party integration for:

- React
- SolidJS

## How it works

### Node structure

fiveway works with navigation nodes composed into a navigation tree.
Although nodes have no specific node type, we can think about most of them as:

- **items** that represent a focusable piece of UI
- **containers** that contain any number of item and container nodes

In your typical frontend framework some of your components like `<Sidebar/>` or `<List/>`
would become container nodes. Component like `<Button/>` is an example of item node.

Nodes inside a container are ordered either by time of insertion or by explicit `order` property.

### Focus

fiveway keeps track of a focused node at all times. When navigation tree gets created its root node is focused.
By default fiveway tries to move focus into item nodes on insertion into the tree.
When a node with focus is removed fiveway searches upwards for a new node to focus.
Focus behavior can be extended using handlers.

### Handlers & actions

Handlers, along with nodes are core of fiveway. Every node has an associated handler that defines its behavior.
In their simplest form handlers are just functions that accept **actions** and return node IDs. fiveway provides set of handlers for common scenarios.
These handlers can be composed and chained together with custom handlers to create unique custom behavior.

When given an action navigation tree passes that action to focused node and its handler. Handler can either return node that should get focused
or pass the action to other (usually parent) node and its handler.

### IDs

Every node has a unique ID. The full ID looks something like this:

```
#/layout/content/login-form/submit-button
```

This URL-like format contains IDs of parent nodes up to root which is denoted as `#`.
Most of the time you will be working with local and relative IDs. For example in component frameworks
when creating a node you only need to provide local ID and parent is usually deduced from context.
