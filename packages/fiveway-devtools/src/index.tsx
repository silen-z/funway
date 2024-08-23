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
  HandlerInfo,
  NavigationNode,
  NavigationTree,
  NodeId,
  getHandlerInfo,
  isParent,
  registerListener,
} from "@fiveway/core";
import { clsx } from "clsx";
import css from "./styles.module.css";
import { Icon } from "@iconify-icon/solid";

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
  const [isOpen, setOpen] = createSignal(false);

  return (
    <div>
      <Show when={isOpen()} fallback={<OpenButton setOpen={setOpen} />}>
        <Sidebar tree={props.tree} close={() => setOpen(false)}></Sidebar>
      </Show>
    </div>
  );
}

function OpenButton(props: { setOpen: Setter<boolean> }) {
  return (
    <button class={css.openButton} onClick={() => props.setOpen(true)}>
      <Icon icon="ic:round-terminal" /> fiveway
    </button>
  );
}

function Sidebar(props: { tree: NavigationTree; close: () => void }) {
  const [side, setSide] = createSignal("right");
  const [isAllExpanded, setAllExpanded] = createSignal(false);
  const [inspectedNode, setInspectedNode] = createSignal<NodeId | null>(null);

  const focusedId = useFocusedId(props.tree);

  const inspectedNodeHandlers = createMemo(() => {
    const inspectId = inspectedNode();
    const focusId = focusedId();

    return getHandlerInfo(props.tree, inspectId ?? focusId);
  });

  const root = useNode(props.tree, "#");

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
        <div class={css.tree}>
          <VisualizeNode
            tree={props.tree}
            node={root()!}
            isAllExpanded={isAllExpanded()}
            setAllExpanded={setAllExpanded}
            setSelectedNode={setInspectedNode}
          />
        </div>
      </div>

      <Show when={inspectedNodeHandlers()}>
        {(hanlders) => (
          <div class={css.inspectedNode}>
            <div class={css.sidebarToolbar} data-variant="alt">
              <div
                style={{ display: "flex", gap: "6px", "align-items": "center" }}
              >
                <Icon
                  icon={
                    inspectedNode()
                      ? "heroicons:eye"
                      : "heroicons:viewfinder-dot-solid"
                  }
                />
                {inspectedNode() ? "inspecting" : "focused"}
              </div>
              <Show when={inspectedNode()}>
                <button onClick={() => setInspectedNode(null)}>
                  stop inspecting
                </button>
              </Show>
            </div>

            <div class={css.inspectedName}>
              <span>{inspectedNode() ?? focusedId()}</span>
            </div>
            <NodeHandlers handlers={hanlders()} />
          </div>
        )}
      </Show>
    </div>
  );
}

function NodeHandlers(props: { handlers: HandlerInfo[] }) {
  return (
    <div class={css.handlerInfo}>
      <For each={props.handlers}>
        {(handler) => {
          const name = "name" in handler ? handler.name.toString() : "<custom>";
          return (
            <div>
              <div class={css.handlerName}>{name}</div>
              <div class={css.handlerProps}>
                <For each={Object.entries(handler)}>
                  {([key, value]) => {
                    if (key === "name") {
                      return null;
                    }

                    return (
                      <span>
                        <span class={css.infoKey}>{key}: </span>
                        <span class={css.infoValue}>{value.toString()}</span>
                      </span>
                    );
                  }}
                </For>
              </div>
            </div>
          );
        }}
      </For>
    </div>
  );
}

function VisualizeNode(props: {
  tree: NavigationTree;
  node: NavigationNode;
  setSelectedNode: Setter<NodeId | null>;
  isAllExpanded: boolean;
  setAllExpanded?: Setter<boolean>;
}) {
  const isNodeFocused = useIsFocused(props.tree, props.node.id);
  const [isNodeOpen, setOpen] = createSignal(false);

  const isOpen = createMemo(
    () => isNodeOpen() || isNodeFocused() || props.isAllExpanded
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
          onClick={() => props.setSelectedNode(props.node.id)}
        >
          {isRoot() ? "# (root)" : getLocalId(props.node.id)}
        </span>

        <Show when={isRoot()} keyed>
          <button
            class={css.nodeTag}
            onClick={() => props.setAllExpanded?.((e) => !e)}
          >
            <Icon
              icon={
                props.isAllExpanded
                  ? "bx:collapse-vertical"
                  : "bx:expand-vertical"
              }
            />
          </button>
        </Show>

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
              const node = useNode(props.tree, child.id);
              return (
                <Show when={node()}>
                  {(n) => (
                    <VisualizeNode
                      tree={props.tree}
                      node={n()}
                      isAllExpanded={props.isAllExpanded}
                      setSelectedNode={props.setSelectedNode}
                    />
                  )}
                </Show>
              );
            }}
          </For>
        </div>
      </Show>
    </div>
  );
}

function useNode(tree: NavigationTree, id: NodeId) {
  const [maybeNode, setNode] = createSignal<NavigationNode | undefined>(
    tree.nodes.get(id),
    { equals: () => false }
  );

  createEffect(() => {
    const cleanup = onCleanup(
      registerListener(tree, {
        node: "#",
        type: "structurechange",
        fn: () => {
          setNode(tree.nodes.get(id));
        },
      })
    );

    onCleanup(cleanup);
  });

  return maybeNode;
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
