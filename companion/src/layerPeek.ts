import { activeLayer, type KeyboardLink } from "./keyboard";

export interface PeekState {
  enabled: boolean;
  durationMs: number;
  following: boolean;
  browsing: boolean;
  keyboard: KeyboardLink;
}

// Keep timing independent of Solid and native APIs so all transitions can use a fake clock.
export function createLayerPeek(setVisible: (visible: boolean) => void) {
  let previous: PeekState | undefined;
  let lastLayer: number | null = null;
  let heldOpen = false;
  let visible: boolean | undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;

  function show(next: boolean): void {
    if (visible === next) return;
    visible = next;
    setVisible(next);
  }

  function cancel(): void {
    clearTimeout(timer);
    timer = undefined;
  }

  function expireAfter(durationMs: number): void {
    cancel();
    timer = setTimeout(() => {
      timer = undefined;
      show(false);
    }, durationMs);
  }

  return {
    update(state: PeekState): void {
      const layer = state.keyboard.connected && state.keyboard.state
        ? activeLayer(state.keyboard.state.layers)
        : null;
      const changed = lastLayer !== null && layer !== null && layer !== lastLayer;
      lastLayer = layer;
      const wasAutomatic = previous?.enabled && previous.following && !previous.browsing;
      const automatic = state.enabled && state.following && !state.browsing;
      const durationChanged = previous?.durationMs !== state.durationMs;
      const newlyEnabled = state.enabled && !previous?.enabled;
      const reveal = !previous || previous.enabled !== state.enabled ||
        previous.following !== state.following || (!previous.browsing && state.browsing);
      previous = state;

      if (!automatic) {
        cancel();
        if (reveal) {
          heldOpen = state.enabled;
          show(true);
        }
      } else if (!wasAutomatic) {
        cancel();
        if (newlyEnabled) heldOpen = false;
        show(heldOpen);
      } else if (heldOpen) {
        return;
      } else if (layer === null) {
        cancel();
        show(false);
      } else if (changed) {
        show(true);
        expireAfter(state.durationMs);
      } else if (timer !== undefined && durationChanged) {
        expireAfter(state.durationMs);
      }
    },
    manualVisibility(next: boolean): void {
      cancel();
      heldOpen = next;
      // Reapply even if our cached value matches: a native command may have raced a peek.
      visible = undefined;
      show(next);
    },
    dispose: cancel,
  };
}
