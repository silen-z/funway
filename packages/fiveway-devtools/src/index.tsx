import {
  createEffect,
  createMemo,
  createSignal,
  For,
  Index,
  onCleanup,
  Show,
} from "solid-js";
import { createStore, reconcile } from "solid-js/store";
import { render } from "solid-js/web";
import {
  ContainerNode,
  NavigationNode,
  NavigationTree,
  NodeId,
  isFocused,
  registerListener,
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
        <VisualizeNode tree={props.tree} nodeId="#" />
      </div>
    </div>
  );
}

function VisualizeNode(props: { tree: NavigationTree; nodeId: NodeId }) {
  const [node, setNode] = createSignal<NavigationNode | undefined>(
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

  const [isOpen, setOpen] = createSignal(false);

  return (
    <Show when={node()}>
      {(node) => (
        <div>
          <div
            class={css.node}
            data-root={node().id === "#"}
            data-focused={isNodeFocused()}
          >
            <span class={css.nodeLabel} title={props.nodeId}>
              {node().id === "#" ? "root" : getLocalId(props.nodeId)}
            </span>

            <Show when={node().type === "item" && isNodeFocused()}>
              <span class={clsx(css.nodeTag, css.nodeTagSuccess)}>
                <Icon icon="heroicons:viewfinder-dot-solid" /> focus
              </span>
            </Show>

            <Show
              when={
                node().type === "container" &&
                node().children.some((c) => c.active) &&
                !isNodeFocused()
              }
            >
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
          <Show when={node().type === "container"}>
            <div
              class={css.nodeContainer}
              data-open={isNodeFocused() || isOpen()}
            >
              <For each={(node() as ContainerNode).children}>
                {(child) => (
                  <VisualizeNode tree={props.tree} nodeId={child.id} />
                )}
              </For>
            </div>
          </Show>
        </div>
      )}
    </Show>
  );
}

function getLocalId(id: NodeId) {
  return id.substring(id.lastIndexOf("/") + 1);
}
