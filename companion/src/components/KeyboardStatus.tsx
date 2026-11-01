import { For, Show } from "solid-js";
import {
  POINTER_MODE_LABEL,
  activeLocks,
  heldModifiers,
  outputLabel,
  pointerMode,
  type KeyboardLink,
} from "../keyboard";

interface KeyboardStatusProps {
  link: KeyboardLink;
  follow: boolean;
  onFollow: (on: boolean) => void;
}

export function KeyboardStatus(props: KeyboardStatusProps) {
  const chips = () => {
    const state = props.link.state;
    if (!state) return [];
    return [
      ...heldModifiers(state.modifiers).map((label) => ({
        label,
        kind: "mod",
      })),
      ...activeLocks(state).map((label) => ({
        label: `${label} lock`,
        kind: "lock",
      })),
    ];
  };

  return (
    <div class="kb-status" aria-live="polite">
      <span
        class="kb-dot"
        classList={{ on: props.link.connected }}
        aria-hidden="true"
      />
      <span>
        {props.link.connected
          ? "Keyboard connected"
          : "Keyboard not found, choose a layer yourself"}
      </span>
      <Show when={props.link.state}>
        {(state) => (
          <>
            <span class="kb-chip">
              Pointer {POINTER_MODE_LABEL[pointerMode(state().layers)]}
            </span>
            <span class="kb-chip">{outputLabel(state())}</span>
            <For each={chips()}>
              {(chip) => (
                <span class={`kb-chip ${chip.kind}`}>{chip.label}</span>
              )}
            </For>
          </>
        )}
      </Show>
      <button
        class="kb-follow"
        aria-pressed={props.follow}
        classList={{ active: props.follow }}
        onClick={() => props.onFollow(!props.follow)}
        title="Show the layer the keyboard is on"
      >
        Follow keyboard: {props.follow ? "on" : "off"}
      </button>
    </div>
  );
}
