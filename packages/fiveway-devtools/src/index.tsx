import {
  createEffect,
  createMemo,
  createSignal,
  For,
  onCleanup,
  Setter,
  Show,
} from "solid-js";
import { render } from "solid-js/web";
import {
  NavigationNode,
  NavigationTree,
  NodeId,
  isFocused,
  registerListener,
  runHandler,
} from "@fiveway/core";
import { clsx } from "clsx";
import css from "./styles.module.css";
import { Icon } from "@iconify-icon/solid";

export function enableDevtools(tree: NavigationTree) {
  let devtoolElement = document.querySelector("#fiveway-devtools");
  if (devtoolElement == null) {
    devtoolElement = document.createElement("div");
    devtoolElement.id = "fiveway-devtools";
    document.body.insertAdjacentElement("beforeend", devtoolElement);
  }

  devtoolElement.innerHTML = "";
  render(() => <DevtoolPanel tree={tree} />, devtoolElement);
}

function DevtoolPanel(props: { tree: NavigationTree }) {
  const [isOpen, setOpen] = createSignal(false);

  return (
    <div>
      <Show
        when={isOpen()}
        fallback={
          <button class={css.openButton} onClick={() => setOpen(true)}>
            <Icon icon="ic:round-terminal" /> fiveway
          </button>
        }
      >
        <Sidebar tree={props.tree} close={() => setOpen(false)}></Sidebar>
      </Show>
    </div>
  );
}

function Sidebar(props: { tree: NavigationTree; close: () => void }) {
  const [side, setSide] = createSignal("right");
  const [isAllExpanded, setAllExpanded] = createSignal(false);
  const [selectedNode, setSelectedNode] = createSignal<NodeId | null>(null);

  const nodeInfo = createMemo(() => {
    const id = selectedNode();
    if (id === null) {
      return null;
    }

    const value = [] as Array<Record<string, string>>;
    runHandler(props.tree, id, {
      kind: "query",
      key: "core:handler-info",
      value,
    });

    return value;
  });

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
        <Icon icon="ic:round-close" onClick={props.close} />
      </header>
      <div class={css.content}>
        <VisualizeNode
          tree={props.tree}
          nodeId="#"
          isAllExpanded={isAllExpanded()}
          setAllExpanded={setAllExpanded}
          setSelectedNode={setSelectedNode}
        />

        <Show when={nodeInfo()}>
          {(info) => (
            <div>
              <div>node: {selectedNode()}</div>
              <div>
                <div>handlers:</div>
                <pre>{JSON.stringify(info(), null, 2)}</pre>
              </div>
            </div>
          )}
        </Show>
      </div>
    </div>
  );
}

function VisualizeNode(props: {
  tree: NavigationTree;
  nodeId: NodeId;
  setSelectedNode: Setter<NodeId | null>;
  isAllExpanded: boolean;
  setAllExpanded?: Setter<boolean>;
}) {
  const [maybeNode, setNode] = createSignal<NavigationNode | undefined>(
    props.tree.nodes.get(props.nodeId),
    { equals: () => false }
  );

  createEffect(() => {
    const cleanup = onCleanup(
      registerListener(props.tree, {
        node: "#",
        type: "structurechange",
        fn: () => {
          setNode(props.tree.nodes.get(props.nodeId));
        },
      })
    );

    onCleanup(cleanup);
  });

  const [isNodeFocused, setFocused] = createSignal(
    isFocused(props.tree, props.nodeId)
  );

  createEffect(() => {
    const cleanup = registerListener(props.tree, {
      node: props.nodeId,
      type: "focuschange",
      fn: () => {
        setFocused(isFocused(props.tree, props.nodeId));
      },
    });
    onCleanup(cleanup);
  });

  const [isNodeOpen, setOpen] = createSignal(false);

  const isOpen = createMemo(
    () => isNodeOpen() || isNodeFocused() || props.isAllExpanded
  );

  return (
    <Show when={maybeNode()}>
      {(node) => {
        const hasChildren = createMemo(() =>
          node().children.some((c) => c.active)
        );

        return (
          <div>
            <div
              class={css.node}
              data-root={node().id === "#"}
              data-focused={isNodeFocused()}
            >
              <span
                class={css.nodeLabel}
                title={props.nodeId}
                onClick={() => props.setSelectedNode(props.nodeId)}
              >
                {node().id === "#" ? "root" : getLocalId(props.nodeId)}
              </span>

              <Show when={node().id === "#"}>
                <Icon
                  icon={
                    props.isAllExpanded
                      ? "bx:collapse-vertical"
                      : "bx:expand-vertical"
                  }
                  onClick={() => props.setAllExpanded?.((e) => !e)}
                />
              </Show>

              <span
                style={{
                  display:
                    !hasChildren() && isNodeFocused() ? undefined : "none",
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
                <For each={node().children}>
                  {(child) => (
                    <VisualizeNode
                      tree={props.tree}
                      nodeId={child.id}
                      isAllExpanded={props.isAllExpanded}
                      setSelectedNode={props.setSelectedNode}
                    />
                  )}
                </For>
              </div>
            </Show>
          </div>
        );
      }}
    </Show>
  );
}

function getLocalId(id: NodeId) {
  return id.substring(id.lastIndexOf("/") + 1);
}
