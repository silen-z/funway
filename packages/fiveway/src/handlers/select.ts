import { runHandler, type NavigationHandler } from "../navigation.js";
import { describeHandler } from "../introspection.js";
import type { NodeId } from "../id.js";
import { type NavigationTree, focusNode } from "../tree.js";

/**
 * @category Handler
 */
function createSelectHandler(onSelect: () => void) {
  const selectHandler: NavigationHandler = (_, action, next) => {
    if (import.meta.env.DEV) {
      describeHandler(action, { name: "core:select" });
    }

    if (action.kind === "select") {
      onSelect();
      return null;
    }

    return next();
  };

  return selectHandler;
}

export function selectNode(
  tree: NavigationTree,
  nodeId: NodeId,
  focus: boolean = true,
) {
  if (focus) {
    focusNode(tree, nodeId);
  }

  runHandler(tree, nodeId, { kind: "select" });
}

export { createSelectHandler as selectHandler };
