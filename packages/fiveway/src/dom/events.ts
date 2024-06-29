import { type NavigationAction } from "../index.js";

const eventKeyToAction: Record<string, NavigationAction> = {
  ArrowUp: { kind: "move", direction: "up" },
  ArrowDown: { kind: "move", direction: "down" },
  ArrowLeft: { kind: "move", direction: "left" },
  ArrowRight: { kind: "move", direction: "right" },
  Enter: { kind: "select" },
  " ": { kind: "select" },
  Backspace: { kind: "move", direction: "back" },
};

export function defaultEventMapping(e: KeyboardEvent): NavigationAction | null {
  return eventKeyToAction[e.key] ?? null;
}
