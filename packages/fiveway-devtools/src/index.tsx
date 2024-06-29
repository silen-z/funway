import { useCallback, useSyncExternalStore } from "react";
import {
  NavigationTree,
  NodeId,
  subscribeToNavigation,
  getLocalId,
} from "@fiveway/core";
import { useNavigationContext } from "@fiveway/react";

import { clsx } from "clsx";
import css from "./styles.module.css";

export function VisualizeTree(props: { tree?: NavigationTree }) {
  const context = useNavigationContext();

  const tree = props.tree ?? context.tree;

  const subscribe = useCallback(
    (cb: () => void) =>
      subscribeToNavigation(tree, cb, { focus: true, structure: true }),
    [tree],
  );

  useSyncExternalStore(
    subscribe,
    () => `${Object.keys(tree.nodes).length}:${tree.focusedId}`,
  );

  return (
    <div className={css.sidebar}>
      <header className={css.title}>Navigation tree - nodes</header>
      <VisualizeNode tree={tree} nodeId={tree.root} />
    </div>
  );
}

function VisualizeNode(props: { tree: NavigationTree; nodeId: NodeId }) {
  const node = props.tree.nodes.get(props.nodeId);
  if (node == null) {
    return null;
  }

  const isRoot = node.id === props.tree.root;

  return (
    <div>
      <div
        className={css.node}
        data-root={isRoot}
        data-focused={props.tree.focusedId === props.nodeId}
      >
        <span className={css.nodeLabel}>
          {isRoot ? "root" : getLocalId(props.nodeId)}
        </span>
        {props.tree.focusedId === props.nodeId && (
          <span className={clsx(css.nodeTag, css.nodeTagSuccess)}>focused</span>
        )}
        {node.type === "container" && (
          <span className={css.nodeTag}>{node.direction}</span>
        )}
        {node.count > 1 && (
          <span className={clsx(css.nodeTag, css.nodeTagError)}>
            duplicates: {node.count}
          </span>
        )}
      </div>
      {node.type === "container" && (
        <div className={css.nodeContainer}>
          {node.children.map((idx) => (
            <VisualizeNode key={idx} tree={props.tree} nodeId={idx} />
          ))}
        </div>
      )}
    </div>
  );
}
