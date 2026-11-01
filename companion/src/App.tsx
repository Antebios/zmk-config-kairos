import { Match, Show, Switch, createMemo } from "solid-js";
import { ComboList } from "./components/ComboList";
import { KeyDetails } from "./components/KeyDetails";
import { Keyboard } from "./components/Keyboard";
import { KeyboardStatus } from "./components/KeyboardStatus";
import { LayerTabs } from "./components/LayerTabs";
import { Legend } from "./components/Legend";
import { Manual } from "./components/Manual";
import { ShortcutsView } from "./components/ShortcutsView";
import { WindowBar } from "./components/WindowBar";
import { COMBOS, LAYERS, combosForLayer } from "./layout";
import {
  followKeyboard,
  highlightedCombo,
  hoveredKey,
  keyboard,
  manualOpen,
  selectedLayer,
  setFollowKeyboard,
  setHighlightedCombo,
  setHoveredKey,
  setSelectedLayer,
  view,
} from "./store";
import { useWindowBehavior } from "./windowBehavior";

export default function App() {
  useWindowBehavior();
  const layer = createMemo(() => LAYERS[selectedLayer()]);
  const combos = createMemo(() => combosForLayer(selectedLayer()));
  const highlighted = createMemo(() =>
    COMBOS.find((entry) => entry.name === highlightedCombo()),
  );

  return (
    <main class={`view-${view()}`}>
      <WindowBar />
      <Show when={!manualOpen()} fallback={<Manual />}>
        <header>
          <LayerTabs
            layers={LAYERS}
            selected={selectedLayer()}
            onSelect={(id) => {
              // Picking a layer by hand means you are not following the keyboard.
              setFollowKeyboard(false);
              setSelectedLayer(id);
            }}
          />
          <KeyboardStatus
            link={keyboard()}
            follow={followKeyboard()}
            onFollow={setFollowKeyboard}
          />
          <p class="reach">{layer().reach}</p>
        </header>
        <Switch>
          <Match when={view() === "normal"}>
            <Keyboard
              layer={layer()}
              highlighted={highlighted()}
              onHover={setHoveredKey}
            />
            <Legend layer={layer()} />
            <KeyDetails layer={layer()} index={hoveredKey()} />
            <ComboList
              layerId={selectedLayer()}
              combos={combos()}
              highlighted={highlightedCombo()}
              onHighlight={setHighlightedCombo}
            />
          </Match>
          <Match when={view() === "compact"}>
            <Keyboard layer={layer()} variant="compact" />
          </Match>
          <Match when={view() === "shortcuts"}>
            <ShortcutsView layerId={selectedLayer()} combos={combos()} />
          </Match>
        </Switch>
      </Show>
    </main>
  );
}
