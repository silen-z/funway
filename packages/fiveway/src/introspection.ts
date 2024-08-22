import type { NavigationHandler } from "./handler.js";
import type { NavigationAction } from "./navigation.js";
import type { NavigationNode } from "./node.js";

export type HandlerInfo = Record<string, string | { toString(): string }>;

export function handlerInfo(action: NavigationAction, info: HandlerInfo) {
  if (action.kind === "query" && action.key === "core:handler-info") {
    if (action.value === null) {
      action.value = [];
    }

    (action.value as Array<HandlerInfo>).push(info);
  }
}

export function defaultHandlerInfo(
  handler: NavigationHandler,
  node: NavigationNode,
  action: NavigationAction
) {
  if (action.kind !== "query" || action.key !== "core:handler-info") {
    return;
  }

  const value: Array<HandlerInfo> = [];
  handler(node, { kind: "query", key: "core:handler-info", value }, () => null);
  if (value.length === 0) {
    handlerInfo(action, {
      name: handler.name !== "" ? handler.name : "custom",
    });
  }
}
