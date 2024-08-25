import { createMemo, Show, For } from "solid-js";
import {
  getHandlerInfo,
  type HandlerInfo,
  type NavigationNode,
} from "@fiveway/core";
import { useDevtoolContext } from "./context.js";
import { Icon } from "@iconify-icon/solid";
import css from "./devtools.module.css";

export function NodeDetail(props: { node: NavigationNode; inspect: boolean }) {
  const devtools = useDevtoolContext();

  const nodeHandlers = createMemo(() =>
    getHandlerInfo(devtools.tree, props.node.id)
  );

  const modeIcon = props.inspect
    ? "heroicons:eye"
    : "heroicons:viewfinder-dot-solid";

  return (
    <div class={css.inspectedNode}>
      <div class={css.sidebarToolbar} data-variant="alt">
        <div style={{ display: "flex", gap: "6px", "align-items": "center" }}>
          <Icon icon={modeIcon} />
          {props.inspect ? "inspecting" : "focused"}
        </div>
        <Show when={devtools.state.inspectedNode}>
          <button
            onClick={() => devtools.dispatch({ type: "inspectNode", id: null })}
          >
            stop inspecting
          </button>
        </Show>
      </div>

      <div class={css.inspectedName}>
        <span>{props.node.id}</span>
      </div>
      <NodeHandlers handlers={nodeHandlers()} />
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
