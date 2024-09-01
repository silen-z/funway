import type { NavigationAction } from "./navigation.js";
import { defineMetadata, type Metadata } from "./metadata.js";

const eventKeyToAction: Record<string, NavigationAction> = {
  ArrowUp: { kind: "move", direction: "up" },
  ArrowDown: { kind: "move", direction: "down" },
  ArrowLeft: { kind: "move", direction: "left" },
  ArrowRight: { kind: "move", direction: "right" },
  Enter: { kind: "select" },
  " ": { kind: "select" },
  Backspace: { kind: "move", direction: "back" },
};

export function defaultEventMapping(e: Event): NavigationAction | null {
  if (e instanceof KeyboardEvent) {
    return eventKeyToAction[e.key] ?? null;
  }

  return null;
}

export const NodeElement: Metadata<HTMLElement> =
  defineMetadata("core:node-element");
