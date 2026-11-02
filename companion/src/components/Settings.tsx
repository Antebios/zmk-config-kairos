import {
  MAX_PEEK_DURATION_MS,
  MIN_PEEK_DURATION_MS,
} from "../settings";
import { peekDurationMs, setPeekDurationMs, setSettingsOpen } from "../store";

export function Settings() {
  return (
    <section class="settings-panel" aria-label="Settings">
      <label>
        Layer peek duration (seconds)
        <input
          type="number"
          required
          min={MIN_PEEK_DURATION_MS / 1000}
          max={MAX_PEEK_DURATION_MS / 1000}
          step={0.5}
          value={peekDurationMs() / 1000}
          onChange={(event) => {
            const input = event.currentTarget;
            if (input.value !== "" && input.checkValidity()) {
              setPeekDurationMs(Math.round(input.valueAsNumber * 1000));
            } else {
              input.reportValidity();
              input.value = String(peekDurationMs() / 1000);
            }
          }}
        />
      </label>
      <p>
        Layer peek hides while idle. Hide the window after browsing to resume peeks.
      </p>
      <button class="toggle" onClick={() => setSettingsOpen(false)}>
        Done
      </button>
    </section>
  );
}
