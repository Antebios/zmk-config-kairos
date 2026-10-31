import { For, Show } from "solid-js";
import { keyPlacement } from "../geometry";
import { GESTURE_INFO, KIND_INFO } from "../keys";
import { comboHints, describeKey, type Combo, type LayerInfo } from "../layout";

interface KeyboardProps {
  layer: LayerInfo;
  highlighted?: Combo | undefined;
  // Compact adds each key's combos and a tooltip, for use without the legend and lists.
  variant?: "normal" | "compact";
  onHover?: (index: number | null) => void;
}

export function Keyboard(props: KeyboardProps) {
  const highlightedKeys = () => new Set(props.highlighted?.keys ?? []);
  const compact = () => props.variant === "compact";

  return (
    <div
      class="keyboard"
      classList={{ compact: compact() }}
      role="group"
      aria-label={`${props.layer.title} layer`}
    >
      <For each={props.layer.keys}>
        {(key, index) => {
          const placement = keyPlacement(index());
          return (
            <div
              class={`key kind-${key.kind}`}
              classList={{
                highlighted: highlightedKeys().has(index()),
              }}
              style={{
                "grid-row": placement.row,
                "grid-column": placement.col,
              }}
              tabindex={0}
              title={
                compact() ? describeKey(props.layer.id, index()) : undefined
              }
              aria-label={`${key.label}, ${KIND_INFO[key.kind].name}`}
              onMouseEnter={() => props.onHover?.(index())}
              onMouseLeave={() => props.onHover?.(null)}
              onFocus={() => props.onHover?.(index())}
              onBlur={() => props.onHover?.(null)}
            >
              <span
                class="tap"
                classList={{
                  long: key.label.length > 5,
                  nowrap: !key.label.includes(" "),
                }}
              >
                {key.label}
              </span>
              <For each={key.gestures}>
                {(entry) => (
                  <span class="chip">
                    <b>{GESTURE_INFO[entry.gesture].short}</b> {entry.action}
                  </span>
                )}
              </For>
              <Show when={compact()}>
                <For each={comboHints(props.layer.id, index())}>
                  {(hint) => (
                    <span class="hint">
                      <b>+{hint.partners.join("+")}</b> {hint.combo.short}
                    </span>
                  )}
                </For>
              </Show>
            </div>
          );
        }}
      </For>
    </div>
  );
}
