import { For, Show } from "solid-js";
import { GESTURE_INFO, KIND_INFO } from "../keys";
import { combosForKey, type LayerInfo } from "../layout";

const LAYER_KINDS = ["layer-hold", "layer-sticky", "layer-switch"];

export function KeyDetails(props: { layer: LayerInfo; index: number | null }) {
  const entry = () =>
    props.index === null ? undefined : props.layer.keys[props.index];

  return (
    <section class="details" aria-live="polite">
      <Show
        when={entry()}
        fallback={<p class="hint">Hover or focus a key for details.</p>}
      >
        {(cell) => (
          <>
            <h3>
              <i class={`swatch kind-${cell().kind}`} />
              {cell().label}
              <span class="kind-name">{KIND_INFO[cell().kind].name}</span>
            </h3>
            <p>{KIND_INFO[cell().kind].description}</p>
            <Show when={cell().kind === "transparent"}>
              <p>
                Inherits <b>{cell().label}</b> from BASE
                {cell().inheritedKind
                  ? ` (${KIND_INFO[cell().inheritedKind!].name})`
                  : ""}
                .
              </p>
            </Show>
            <Show
              when={cell().kind !== "transparent" && cell().kind !== "none"}
            >
              <dl>
                <dt>{LAYER_KINDS.includes(cell().kind) ? "Action" : "Tap"}</dt>
                <dd>{cell().tap ?? cell().label}</dd>
                <For each={cell().gestures}>
                  {(item) => (
                    <>
                      <dt>{GESTURE_INFO[item.gesture].name}</dt>
                      <dd>{item.action}</dd>
                    </>
                  )}
                </For>
              </dl>
            </Show>
            <Show when={combosForKey(props.layer.id, props.index!).length > 0}>
              <p class="in-combos">
                Combos:{" "}
                {combosForKey(props.layer.id, props.index!)
                  .map((combo) => combo.action)
                  .join(" · ")}
              </p>
            </Show>
          </>
        )}
      </Show>
    </section>
  );
}
