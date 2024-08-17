import type { ContainerNode, NodeChild } from "./node.js";

// TODO convert to functions with callback
class DefaultChildrenIterator implements Iterator<NodeChild> {
  initialIndex: number | null;
  current = 0;

  constructor(public node: ContainerNode) {
    this.initialIndex = -1; // node.initial !== null ? null : -1;
  }

  next() {
    // if (this.initialIndex === null) {
    //   this.initialIndex = this.node.children.findIndex(
    //     (c) => c.id === this.node.initial
    //   );
    //   if (this.initialIndex !== -1) {
    //     return { done: false, value: this.node.children[this.initialIndex]! };
    //   }
    // }

    if (this.current === this.initialIndex) {
      this.current += 1;
    }

    if (this.current >= this.node.children.length) {
      return { done: true, value: undefined } as const;
    }

    return { done: false, value: this.node.children[this.current++]! };
  }
}

class BackwardsChildrenIterator implements Iterator<NodeChild> {
  current: number;

  constructor(public node: ContainerNode) {
    this.current = node.children.length - 1;
  }

  next() {
    if (this.current < 0) {
      return { done: true, value: undefined } as const;
    }

    return { done: false, value: this.node.children[this.current--]! };
  }
}

export function childrenIterator(
  node: ContainerNode,
  direction?: "front" | "back"
): Iterable<NodeChild> {
  if (direction === "front") {
    return node.children;
  }

  if (direction === "back") {
    return {
      [Symbol.iterator]: () => new BackwardsChildrenIterator(node),
    };
  }

  return {
    [Symbol.iterator]: () => new DefaultChildrenIterator(node),
  };
}
