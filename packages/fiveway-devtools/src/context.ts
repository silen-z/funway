import { createContext, useContext } from "solid-js";
import type { NodeId, NavigationTree } from "@fiveway/core";

export type DevtoolsAction =
  | { type: "openPanel" }
  | { type: "closePanel" }
  | { type: "toggleExpand" }
  | { type: "inspectNode"; id: NodeId | null };

export type DevtoolsState = {
  panelOpen: boolean;
  expandAll: boolean;
  inspectedNode: NodeId | null;
};

export type DevtoolsContext = {
  tree: NavigationTree;
  state: DevtoolsState;
  dispatch: (action: DevtoolsAction) => void;
};

export const DevtoolsContext = createContext<DevtoolsContext>();

export function useDevtoolContext() {
  const devtools = useContext(DevtoolsContext);
  if (devtools == null) {
    throw new Error();
  }

  return devtools;
}
