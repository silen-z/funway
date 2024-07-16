# fiveway

TypeScript library for keyboard navigation. Manage focus along a navigation tree in your favorite framework. Extend the behavior via system of middlewares.

### Features

 - **configurable** - pick focus handler for your specific use-case, attach callbacks, enable/disable nodes, specify order and capture focus inside specific nodes

 - **extensible** - handlers are designed to be further extended and chained together via sofisticated middleware system

 - **framework agnostic** - seamlesly and consistently usable in any framework and even works across different ones at the same time 

 - **robust** - consistent with predictable defaults, tries its hardest to not lose focus, works with framework lifecycles and hot-module-reloading

 - **performance** - performant while not sacrificing functionality and maintainability

## @fiveway/core

This package contains the core functionality used by the framework specific integrations.

### Getting started

- **React**: https://www.npmjs.com/package/@fiveway/react

- **SolidJS**: https://www.npmjs.com/package/@fiveway/solid