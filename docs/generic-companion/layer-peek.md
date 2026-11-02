# Layer-Change Peek: Findings And Future Planning

## Scope And Approval

On 2026-11-02 the user approved implementing short layer-change peeks in the
existing Kairos44 companion, explicitly **without starting the generic companion
application**. The requested inspiration was Layer Lens's show-on-layer-change
mode; no external implementation or popularity claim was independently verified.

The user chose a **5-second default**, an adjustable setting, and explicitly
required the feature to be optional. Generic profiles, generalized telemetry,
new transports and firmware changes remain unapproved and unimplemented.

## Current Kairos44 Implementation

- **Opt-in and off by default**, including migration of old saved settings.
  Toggle through the title bar, tray or `--toggle-layer-peek`.
- Global persisted `layerPeek` and `peekDurationMs` settings, separate from view
  size/pin/opacity. Settings accepts 0.5-60 seconds; default is 5 seconds.
- Compare the effective visible layer from
  [activeLayer](../../companion/src/keyboard.ts), not the raw layer mask or
  reported `highest`. Kairos44's higher pointer-mode/helper layers must not
  open the window.
- First connection/reconnection is a baseline. Actual effective-layer changes,
  including return to BASE, show the selected view and restart the hide timer.
  Modifier/lock/output reports and unchanged effective layers do not extend it.
- Disconnect cancels the transient peek; manual browsing remains possible.
- Explicit show holds the window open until explicit hide. Manual/Settings and
  Follow-off browsing suspend auto-hide. Hide closes those panels and re-arms
  the next layer change; Follow must be on for automatic peeks.
- Disabling cancels timers and shows the window. No selected view, pin, opacity,
  click-through or keyboard firmware changes are required.
- [Visibility controller](../../companion/src/layerPeek.ts) is independent of
  Solid/native APIs. [Window effects](../../companion/src/windowBehavior.ts)
  supply state and [windowing](../../companion/src/windowing.ts) serializes
  visibility requests. [Native window control](../../companion/src-tauri/src/lib.rs)
  uses the existing Hyprland workspace/focus-preserving path rather than merely
  hiding rendered HTML. A mutex serializes native visibility operations.
- Browser preview keeps the reference usable and disables the native-only toggle.

This reuses existing state-only USB telemetry. It does not collect keystrokes,
add a firmware protocol, implement an adapter framework or infer layers from
host typing. "Open on activation" means show the already-running companion,
not start an application when no companion process is running.

## Generic Companion Implications (Planning Only)

1. Preserve this optional UX during Kairos44 profile parity (P2/P4). Do not
   change existing opt-in settings during migration.
2. Derive a stable **effective reference-layer identity** from the selected
   adapter/profile's authoritative state. Do not copy Kairos44's seven-layer
   loop, numeric highest-bit assumption, pointer-bit mapping or 32-bit mask.
3. Keep visibility policy in the host UI, separate from firmware/transport.
   Existing authoritative layer telemetry is sufficient; a new "peek" packet
   is unnecessary.
4. Unsupported/unknown layer state must disable automatic peeks with a visible
   capability explanation when the app is opened. Static reference remains
   usable. Unknown must not be interpreted as BASE or a layer transition.
5. Reset the baseline on device/profile/adapter changes, reconnect or stale-state
   recovery. Do not show a false transition between unrelated keyboard states.
6. Resolve profile/device scoping for mode/duration during P4 rather than adding
   unneeded generic configuration to today's app. Keep explicit-show overrides
   transient and preserve offline browsing.
7. Retain accessible controls while hidden (tray/CLI). Use platform-native
   visibility and serialize operations; do not make focus restoration assumptions
   from one compositor apply to every platform.

These are additions to the existing plan, not new implementation authorization.

## Validation And Remaining Evidence

Automated coverage lives in
[layerPeek.test.ts](../../companion/src/layerPeek.test.ts),
[settings.test.ts](../../companion/src/settings.test.ts) and
[windowing.test.ts](../../companion/src/windowing.test.ts). It covers exact
5-second deadlines, timer restart/cancellation, reconnect baselines, ignored
pointer/modifier/lock updates, return to BASE, optional/default-off behavior,
saved duration bounds, browsing/explicit overrides and serialized commands.

Before generic acceptance, repeat those checks with non-Kairos layer identities,
unknown capabilities, profile switching and adapter handoff. Verify that disabled
mode never opens a hidden window on any telemetry event.

Real compositor focus, global click-through recovery, sustained rapid
momentary-layer switching, minimized windows, hidden-webview timer throttling
and live USB disconnect/reconnect need desktop/hardware testing. Validate
Hyprland, X11, Windows and macOS separately. Browser/unit tests and native
compilation do not establish end-to-end keyboard or focus behavior.

### Current-App Validation Recorded On 2026-11-02

- `npm run check --prefix companion`: passed type checking, 94 frontend tests,
  24 Rust tests (one existing ignored test), and native `cargo check`.
- `npm run build --prefix companion`: passed TypeScript and production Vite build.
- Focused timing/settings/windowing/manual tests: 46 passed after final edits.
- Browser interaction: default 5-second value, duration editing/persistence,
  Settings open/close and disabled native toggle in browser preview passed.
- Actual Solid app with Tauri's official mocked IPC/events and a browser clock:
  disabled mode did not reveal the window; enabling showed on an effective-layer
  change and hid at 5000 ms, not at 4999 ms. Explicit show held visibility,
  manual hide re-armed BASE peeks, a 1-second setting changed the deadline, and
  the tray/CLI toggle event disabled further peeks.
- All 53 relative links in this planning directory resolved; `git diff --check`
  passed.

This evidence validates the existing Kairos44 app's policy and integration
wiring, not real compositor focus, physical keyboard behavior, an installed
release binary, or any generic adapter/profile implementation.
