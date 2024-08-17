import type {
  NodeId,
  NavigationHandler,
  FocusOptions,
  Provider,
} from "@fiveway/core";

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
  provide: <P extends Provider<unknown>>(
    provider: P,
    value: P extends Provider<infer V> ? V : never
  ) => void;
  registerElement: (element: HTMLElement | null) => void;
};
