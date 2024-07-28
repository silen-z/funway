export type NodeId = string;

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
      if (node1.startsWith(id)) {
        return false;
      }

      cb(id);
    });
  }

  idsToRoot(node1, cb);
}

export function idsToRoot(nodeId: NodeId, cb: (id: NodeId) => boolean | void) {
  cb(nodeId);

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
  if (!descendantId.startsWith(parentId + "/")) {
    return null;
  }

  const firstSlash = descendantId.indexOf("/", parentId.length + 1);

  return firstSlash !== -1
    ? descendantId.substring(0, firstSlash)
    : descendantId;
}
