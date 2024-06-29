import {
  type FocusOptions,
  type NavigationTree,
  focusNode,
  getNode,
  selectNode,
  traverseNodes,
} from "./tree.js";
import {
  type NavigationContainer,
  type NavigationNode,
  type NodeId,
  createProvider,
} from "./node.js";

export type NavigationDirection = "up" | "down" | "left" | "right";
export type NavigationAction =
  | { kind: "select" }
  | { kind: "move"; direction: NavigationDirection | "back" }
  | { kind: "focus"; from: NavigationDirection | null };

export type NavigationHandlerContext = {
  path: NodeId[];
};

export type NavigationHandler = (
  node: NavigationNode,
  action: NavigationAction,
  context: NavigationHandlerContext
) => NodeId | null;

export function handleAction(tree: NavigationTree, action: NavigationAction) {
  const node = getNode(tree, tree.focusedId);
  const targetId = node.handler(node, action, { path: [] });
  if (targetId === null) {
    return;
  }

  focusNode(tree, targetId);
}

export function childFocusHandler(
  node: NavigationNode,
  action: NavigationAction,
  context: NavigationHandlerContext,
  traverseBackwards = false
) {
  if (node.type === "item") {
    return node.id;
  }

  for (
    let i = !traverseBackwards ? 0 : node.children.length - 1;
    !traverseBackwards ? i < node.children.length : i >= 0;
    !traverseBackwards ? i++ : i--
  ) {
    const child = node.children[i]!;

    if (!child.active) {
      continue;
    }

    const childNode = getNode(node.tree, child.id);
    const focusableNode = childNode.handler(childNode, action, context);

    if (focusableNode !== null) {
      return focusableNode;
    }
  }

  return null;
}

export function parentHandler(
  node: NavigationNode,
  action: NavigationAction,
  context: NavigationHandlerContext
): NodeId | null {
  if (action.kind === "focus") {
    return childFocusHandler(node, action, context);
  }

  if (
    node.parent === null ||
    (node.type === "container" && node.captureFocus)
  ) {
    return null;
  }
  const parentNode = getNode(node.tree, node.parent);

  context.path.push(node.id);
  return parentNode.handler(parentNode, action, context);
}

export function verticalList(
  node: NavigationNode,
  action: NavigationAction,
  context: NavigationHandlerContext
) {
  if (node.type !== "container") {
    throw Error("verticalList handler can only be used on containers");
  }

  if (action.kind === "focus") {
    return childFocusHandler(node, action, context, action.from === "up");
  }

  if (action.kind === "move") {
    switch (action.direction) {
      case "up": {
        let childId = context.path.at(-1) ?? node.tree.focusedId;

        for (;;) {
          const prevChildId = previousChild(node, childId);
          if (prevChildId === null) {
            return parentHandler(node, action, context);
          }

          const childNode = getNode(node.tree, prevChildId);
          const targetNode = childNode.handler(
            childNode,
            { kind: "focus", from: action.direction },
            context
          );

          if (targetNode === null) {
            childId = prevChildId;
            continue;
          }

          return targetNode;
        }
      }
      case "down": {
        let childId = context.path.at(-1) ?? node.tree.focusedId;

        for (;;) {
          const nextChildId = nextChild(node, childId);
          if (nextChildId === null) {
            return parentHandler(node, action, context);
          }

          const childNode = getNode(node.tree, nextChildId);
          const targetNode = childNode.handler(
            childNode,
            { kind: "focus", from: action.direction },
            context
          );

          if (targetNode === null) {
            childId = nextChildId;
            continue;
          }

          return targetNode;
        }
      }
    }
  }

  return parentHandler(node, action, context);
}

export function horizontalList(
  node: NavigationNode,
  action: NavigationAction,
  context: NavigationHandlerContext
) {
  if (node.type !== "container") {
    throw Error("horizontalList handler can only be used on containers");
  }

  if (action.kind === "focus") {
    return childFocusHandler(node, action, context, action.from === "left");
  }

  if (action.kind === "move") {
    switch (action.direction) {
      case "left": {
        let childId = context.path.at(-1) ?? node.tree.focusedId;

        for (;;) {
          const prevChildId = previousChild(node, childId);
          if (prevChildId === null) {
            return parentHandler(node, action, context);
          }

          const childNode = getNode(node.tree, prevChildId);
          const targetNode = childNode.handler(
            childNode,
            { kind: "focus", from: action.direction },
            context
          );

          if (targetNode === null) {
            childId = prevChildId;
            continue;
          }

          return targetNode;
        }
      }

      case "right": {
        let childId = context.path.at(-1) ?? node.tree.focusedId;

        for (;;) {
          const nextChildId = nextChild(node, childId);
          if (nextChildId === null) {
            return parentHandler(node, action, context);
          }

          const childNode = getNode(node.tree, nextChildId);
          const targetNode = childNode.handler(
            childNode,
            { kind: "focus", from: action.direction },
            context
          );

          if (targetNode === null) {
            childId = nextChildId;
            continue;
          }

          return targetNode;
        }
      }
    }
  }

  return parentHandler(node, action, context);
}

export function itemHandler(
  node: NavigationNode,
  action: NavigationAction,
  context: NavigationHandlerContext
): NodeId | null {
  if (action.kind === "focus") {
    return node.id;
  }

  if (action.kind === "select") {
    selectNode(node.tree, node.id, true);
    return null;
  }

  return parentHandler(node, action, context);
}

function previousChild(
  node: NavigationContainer,
  nodeId: NodeId
): NodeId | null {
  const currentIndex = node.children.findIndex((child) => child.id === nodeId);

  if (currentIndex === -1) {
    throw new Error("unexpected");
  }

  let prexIndex = currentIndex - 1;
  while (prexIndex >= 0) {
    if (node.children[prexIndex]?.active) {
      return node.children[prexIndex]!.id;
    }
    prexIndex -= 1;
  }

  return null;
}

function nextChild(node: NavigationContainer, nodeId: NodeId): NodeId | null {
  const currentIndex = node.children.findIndex((child) => child.id === nodeId);

  if (currentIndex === -1) {
    throw new Error("unexpected");
  }

  let nextIndex = currentIndex + 1;
  while (nextIndex < node.children.length) {
    if (node.children[nextIndex]?.active) {
      return node.children[nextIndex]!.id;
    }
    nextIndex += 1;
  }

  return null;
}

export function requestFocus(
  tree: NavigationTree,
  nodeId: NodeId,
  options: FocusOptions = {}
) {
  if (!tree.nodes.has(nodeId)) {
    console.error(`Trying to focus node ${nodeId} that doesn't exist`);
    return;
  }

  focusNode(tree, nodeId, options);
}

type GridPosition = {
  row: number;
  col: number;
};
export const GridPositionProvider = createProvider<GridPosition>("GridPoition");

const distanceFns: Record<
  NavigationDirection,
  (current: GridPosition, potential: GridPosition) => number | null
> = {
  up: (current, potential) => {
    if (potential.col !== current.col) {
      return null;
    }
    const distance = current.row - potential.row;
    return distance > 0 ? distance : null;
  },
  down: (current, potential) => {
    if (potential.col !== current.col) {
      return null;
    }
    const distance = potential.row - current.row;
    return distance > 0 ? distance : null;
  },

  left: (current, potential) => {
    if (potential.row !== current.row) {
      return null;
    }
    const distance = current.col - potential.col;
    return distance > 0 ? distance : null;
  },
  right: (current, potential) => {
    if (potential.row !== current.row) {
      return null;
    }
    const distance = potential.col - current.col;
    return distance > 0 ? distance : null;
  },
};

export function grid(
  node: NavigationNode,
  action: NavigationAction,
  context: NavigationHandlerContext
) {
  if (action.kind === "focus") {
    return childFocusHandler(node, action, context);
  }

  if (action.kind === "select") {
    return parentHandler(node, action, context);
  }

  if (action.direction === "back") {
    return parentHandler(node, action, context);
  }

  const focusedNode = getNode(node.tree, context.path.at(-1)!);
  const focusedPos = GridPositionProvider.extract(focusedNode);
  if (focusedPos == null) {
    return parentHandler(node, action, context);
  }

  const getDistance = distanceFns[action.direction];

  let closestId: NodeId | null = null;
  let shortestDistance: number | null = null;

  traverseNodes(node.tree, node.id, (potentialNode) => {
    if (!potentialNode.focusable) {
      return;
    }

    const potentialPos = GridPositionProvider.extract(potentialNode);
    if (potentialPos == null) {
      return;
    }

    const distance = getDistance(focusedPos, potentialPos);
    if (distance === null) {
      return;
    }

    if (shortestDistance === null || distance < shortestDistance) {
      closestId = potentialNode.id;
      shortestDistance = distance;
    }
  });

  if (closestId != null) {
    const closestNode = getNode(node.tree, closestId);
    return closestNode.handler(
      closestNode,
      { kind: "focus", from: action.direction },
      context
    );
  }

  return parentHandler(node, action, context);
}
