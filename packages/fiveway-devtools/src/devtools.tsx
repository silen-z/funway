import {
  createEffect,
  createMemo,
  createSignal,
  For,
  onCleanup,
  Show,
  useContext,
} from "solid-js";
import { createStore } from "solid-js/store";
import { render } from "solid-js/web";
import {
  type NavigationNode,
  type NavigationTree,
  type NodeId,
  isParent,
  registerListener,
} from "@fiveway/core";
import { Icon } from "@iconify-icon/solid";
import { clsx } from "clsx";
import css from "./devtools.module.css";
import {
  DevtoolsContext,
  useDevtoolContext,
  type DevtoolsAction,
  type DevtoolsState,
} from "./context.js";
import { NodeDetail } from "./detail.jsx";

export function enableDevtools(tree: NavigationTree) {
  const devtoolElement =
    document.querySelector("#fiveway-devtools") ??
    document.createElement("div");

  const dispose = render(() => <DevtoolPanel tree={tree} />, devtoolElement);

  if (devtoolElement.id === "") {
    devtoolElement.id = "fiveway-devtools";
    document.body.insertAdjacentElement("beforeend", devtoolElement);
  }

  return () => {
    dispose();
    document.querySelector("#fiveway-devtools")?.remove();
  };
}

function DevtoolPanel(props: { tree: NavigationTree }) {
  const [state, setState] = createStore<DevtoolsState>({
    panelOpen: false,
    expandAll: false,
    inspectedNode: null,
  });

  const handleAction = (action: DevtoolsAction) => {
    switch (action.type) {
      case "openPanel": {
        setState("panelOpen", true);
        break;
      }
      case "closePanel": {
        setState("panelOpen", false);
        break;
      }

      case "toggleExpand": {
        setState("expandAll", (on) => !on);
        break;
      }

      case "inspectNode":
        setState("inspectedNode", action.id);
        break;
    }
  };

  return (
    <DevtoolsContext.Provider
      value={{ tree: props.tree, state, dispatch: handleAction }}
    >
      <OpenButton />
      <Show when={state.panelOpen}>
        <Sidebar />
      </Show>
    </DevtoolsContext.Provider>
  );
}

function OpenButton() {
  const devtools = useDevtoolContext();

  return (
    <button
      style={{ display: devtools.state.panelOpen ? "none" : undefined }}
      class={css.openButton}
      onClick={() => devtools.dispatch({ type: "openPanel" })}
    >
      <Icon icon="ic:round-terminal" /> fiveway
    </button>
  );
}

function Sidebar() {
  const devtools = useDevtoolContext();

  const [side, setSide] = createSignal("right");
  const root = useNode(devtools.tree, () => "#")!;

  const focusedId = useFocusedId(devtools.tree);

  const detailedNode = useNode(
    devtools.tree,
    () => devtools.state.inspectedNode ?? focusedId()
  );

  return (
    <div class={css.sidebar} data-side={side()}>
      <header class={css.sidebarToolbar}>
        <span class={css.title}>
          <Icon icon="ic:round-terminal" /> fiveway: devtools
        </span>
        <Icon
          onClick={() => setSide((s) => (s === "left" ? "right" : "left"))}
          icon={
            side() === "left"
              ? "fluent:panel-right-32-filled"
              : "fluent:panel-left-32-filled"
          }
        />
        <Icon
          icon="ic:round-close"
          onClick={() => devtools.dispatch({ type: "closePanel" })}
        />
      </header>

      <div class={css.tree}>
        <button
          class={css.nodeTag}
          onClick={() => devtools.dispatch({ type: "toggleExpand" })}
        >
          <Icon
            icon={
              devtools.state.expandAll
                ? "bx:collapse-vertical"
                : "bx:expand-vertical"
            }
          />
        </button>

        <VisualizeNode node={root()!} />
      </div>

      <Show keyed when={detailedNode()}>
        {(node) => (
          <NodeDetail
            node={node}
            inspect={devtools.state.inspectedNode != null}
          />
        )}
      </Show>
    </div>
  );
}

function VisualizeNode(props: { node: NavigationNode }) {
  const devtools = useContext(DevtoolsContext)!;

  const isNodeFocused = useIsFocused(devtools.tree, props.node.id);
  const [isNodeOpen, setOpen] = createSignal(false);

  const isOpen = createMemo(
    () => isNodeOpen() || isNodeFocused() || devtools.state.expandAll
  );
  const hasChildren = createMemo(() =>
    props.node.children.some((c) => c.active)
  );

  const isRoot = () => props.node.id === "#";
  return (
    <div>
      <div class={css.node} data-root={isRoot()} data-focused={isNodeFocused()}>
        <span
          class={css.nodeLabel}
          title={props.node.id}
          onClick={() =>
            devtools.dispatch({ type: "inspectNode", id: props.node.id })
          }
        >
          {isRoot() ? "# (root)" : getLocalId(props.node.id)}
        </span>

        <span
          style={{
            display: !hasChildren() && isNodeFocused() ? undefined : "none",
          }}
          class={clsx(css.nodeTag, css.nodeTagSuccess)}
        >
          <Icon icon="heroicons:viewfinder-dot-solid" /> focus
        </span>

        <Show when={!isNodeFocused() && hasChildren()}>
          <div onClick={() => setOpen((o) => !o)} class={css.nodeTag}>
            <Icon
              icon={
                isOpen()
                  ? "heroicons:chevron-up"
                  : "heroicons:ellipsis-horizontal"
              }
            />
          </div>
        </Show>
      </div>
      <Show when={hasChildren()}>
        <div class={css.nodeContainer} data-open={isOpen()}>
          <For each={props.node.children}>
            {(child) => {
              const node = useNode(devtools.tree, () => child.id);
              return (
                <Show when={node()}>{(n) => <VisualizeNode node={n()} />}</Show>
              );
            }}
          </For>
        </div>
      </Show>
    </div>
  );
}

function useNode(tree: NavigationTree, id: () => NodeId) {
  const [node, setNode] = createSignal<NavigationNode | undefined>(
    tree.nodes.get(id()),
    { equals: () => false }
  );

  createEffect(() => {
    const watchedId = id();

    setNode(tree.nodes.get(watchedId));

    const cleanup = onCleanup(
      registerListener(tree, {
        node: "#",
        type: "structurechange",
        fn: () => {
          setNode(tree.nodes.get(watchedId));
        },
      })
    );

    onCleanup(cleanup);
  });

  return node;
}

function useIsFocused(tree: NavigationTree, id: NodeId) {
  const focusedId = useFocusedId(tree, id);

  return () => focusedId() === id || isParent(id, focusedId());
}

function useFocusedId(tree: NavigationTree, listenOn: NodeId = "#") {
  const [nodeId, setNodeId] = createSignal(tree.focusedId);

  createEffect(() => {
    const cleanup = registerListener(tree, {
      node: listenOn,
      type: "focuschange",
      fn: () => {
        setNodeId(tree.focusedId);
      },
    });
    onCleanup(cleanup);
  });

  return nodeId;
}

function getLocalId(id: NodeId) {
  return id.substring(id.lastIndexOf("/") + 1);
}
