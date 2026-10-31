import { For } from "solid-js";
import type { LayerInfo } from "../layout";

interface LayerTabsProps {
  layers: LayerInfo[];
  selected: number;
  onSelect: (id: number) => void;
}

export function LayerTabs(props: LayerTabsProps) {
  return (
    <div class="tabs" role="tablist">
      <For each={props.layers}>
        {(layer) => (
          <button
            role="tab"
            aria-selected={props.selected === layer.id}
            classList={{ active: props.selected === layer.id }}
            onClick={() => props.onSelect(layer.id)}
          >
            {layer.name}
          </button>
        )}
      </For>
    </div>
  );
}
