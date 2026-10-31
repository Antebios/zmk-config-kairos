import { For, Show } from "solid-js";
import { GESTURE_INFO, KIND_INFO, type Gesture, type KeyKind } from "../keys";
import type { LayerInfo } from "../layout";

const KIND_ORDER: KeyKind[] = [
  "key",
  "mod-tap",
  "layer-tap",
  "tap-dance",
  "layer-hold",
  "layer-sticky",
  "layer-switch",
  "mouse",
  "system",
  "media",
  "transparent",
  "none",
];

const GESTURE_ORDER: Gesture[] = [
  "hold",
  "tap-hold",
  "double-tap",
  "double-tap-hold",
  "triple-tap",
  "triple-tap-hold",
];

export function Legend(props: { layer: LayerInfo }) {
  const kinds = () =>
    KIND_ORDER.filter((kind) =>
      props.layer.keys.some((entry) => entry.kind === kind),
    );
  const gestures = () =>
    GESTURE_ORDER.filter((gesture) =>
      props.layer.keys.some((entry) =>
        entry.gestures.some((item) => item.gesture === gesture),
      ),
    );

  return (
    <div class="legend" aria-label="Legend">
      <For each={kinds()}>
        {(kind) => (
          <span class="legend-item" title={KIND_INFO[kind].description}>
            <i class={`swatch kind-${kind}`} />
            {KIND_INFO[kind].name}
          </span>
        )}
      </For>
      <Show when={gestures().length > 0}>
        <span class="legend-gap" />
        <For each={gestures()}>
          {(gesture) => (
            <span class="legend-item">
              <b class="gesture-code">{GESTURE_INFO[gesture].short}</b>
              {GESTURE_INFO[gesture].name}
            </span>
          )}
        </For>
      </Show>
    </div>
  );
}
