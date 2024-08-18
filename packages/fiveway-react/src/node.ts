import type { NodeId, NavigationHandler, FocusOptions } from "@fiveway/core";

export type NodeOptions = {
  id: NodeId;
  parent?: NodeId;
  order?: number;
  handler?: NavigationHandler;
};

export type NodeHandle = {
  id: NodeId;
  isFocused: () => boolean;
  focus: (nodeId?: NodeId, options?: FocusOptions) => void;
};
