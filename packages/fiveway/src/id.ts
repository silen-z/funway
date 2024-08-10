export type NodeId = string;

export const ROOT = "#";

export function createGlobalId(head: NodeId, ...tail: NodeId[]) {
  return [head, ...tail].join("/");
}

export function scopedId(scope: NodeId, nodeId: NodeId) {
  if (nodeId.startsWith("#")) {
    return nodeId;
  }

  return createGlobalId(scope, nodeId);
}

export function isParent(parentId: NodeId, childId: NodeId) {
  return childId.startsWith(parentId + "/");
}

export function convergingPaths(
  node1: NodeId,
  node2: NodeId,
  cb: (id: NodeId) => void
) {
  if (node1 !== node2) {
    idsToRoot(node2, (id) => {
      if (isParent(id, node1)) {
        return false;
      }

      cb(id);
    });
  }

  idsToRoot(node1, cb);
}

export function idsToRoot(nodeId: NodeId, cb: (id: NodeId) => boolean | void) {
  const cont = cb(nodeId);
  if (cont === false) {
    return;
  }

  for (;;) {
    const idx = nodeId.lastIndexOf("/");
    if (idx === -1) {
      return;
    }

    nodeId = nodeId.substring(0, idx);
    if (cb(nodeId) === false) {
      return;
    }
  }
}

export function directChildId(parentId: NodeId, descendantId: NodeId) {
  if (!isParent(parentId, descendantId)) {
    return null;
  }

  const slash = descendantId.indexOf("/", parentId.length + 1);
  if (slash === -1) {
    return descendantId;
  }

  return descendantId.substring(0, slash);
}
