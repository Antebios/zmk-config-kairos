import { createMemo, createSignal } from "solid-js";
import { filterCombos, type Combo } from "../layout";
import { ComboList } from "./ComboList";

interface ShortcutsViewProps {
  layerId: number;
  combos: Combo[];
}

export function ShortcutsView(props: ShortcutsViewProps) {
  const [query, setQuery] = createSignal("");
  const shown = createMemo(() =>
    filterCombos(props.layerId, props.combos, query()),
  );

  return (
    <section class="shortcuts">
      <input
        class="search"
        type="search"
        placeholder="Filter by action or key, for example paste or Z"
        aria-label="Filter shortcuts"
        value={query()}
        onInput={(event) => setQuery(event.currentTarget.value)}
      />
      <ComboList layerId={props.layerId} combos={shown()} />
      {shown().length === 0 && (
        <p class="empty">No shortcuts match on this layer.</p>
      )}
    </section>
  );
}
