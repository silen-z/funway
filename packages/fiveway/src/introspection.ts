import {
  type NavigationAction,
  type NavigationHandler,
  runHandler,
} from "./navigation.js";
import type { NodeId } from "./id.js";
import type { NavigationNode } from "./node.js";
import type { NavigationTree } from "./tree.js";

export type HandlerInfo = Record<string, string | { toString(): string }>;

export function describeHandler(action: NavigationAction, info: HandlerInfo) {
  if (action.kind === "query" && action.key === "core:handler-info") {
    if (!Array.isArray(action.value)) {
      action.value = [];
    }

    (action.value as HandlerInfo[]).push(info);
  }
}

export function getHandlerInfo(
  tree: NavigationTree,
  id: NodeId
): HandlerInfo[] {
  const value = [] as HandlerInfo[];
  runHandler(tree, id, {
    kind: "query",
    key: "core:handler-info",
    value,
  });

  return value;
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
    describeHandler(action, {
      name: handler.name !== "" ? handler.name : "custom",
    });
  }
}
