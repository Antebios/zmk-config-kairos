import { For } from "solid-js";
import { comboKeyLabels, type Combo } from "../layout";

interface ComboListProps {
  layerId: number;
  combos: Combo[];
  highlighted?: string | null;
  onHighlight?: (name: string | null) => void;
}

const KIND_LABEL = {
  shortcut: "Shortcuts",
  symbol: "Keys and symbols",
  system: "System",
} as const;

export function ComboList(props: ComboListProps) {
  const groups = () =>
    (Object.keys(KIND_LABEL) as (keyof typeof KIND_LABEL)[])
      .map((kind) => ({
        kind,
        items: props.combos.filter((entry) => entry.kind === kind),
      }))
      .filter((group) => group.items.length > 0);

  return (
    <div class="combos">
      <For each={groups()}>
        {(group) => (
          <section>
            <h3>{KIND_LABEL[group.kind]}</h3>
            <ul>
              <For each={group.items}>
                {(entry) => (
                  <li
                    classList={{ active: props.highlighted === entry.name }}
                    onMouseEnter={() => props.onHighlight?.(entry.name)}
                    onMouseLeave={() => props.onHighlight?.(null)}
                  >
                    <span class="action">{entry.action}</span>
                    <span class="chord">
                      <For each={comboKeyLabels(props.layerId, entry)}>
                        {(label, index) => (
                          <>
                            {index() > 0 && <span class="plus">+</span>}
                            <kbd>{label}</kbd>
                          </>
                        )}
                      </For>
                    </span>
                  </li>
                )}
              </For>
            </ul>
          </section>
        )}
      </For>
    </div>
  );
}
