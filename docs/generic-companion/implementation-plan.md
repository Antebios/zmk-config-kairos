# Proposed Generic Companion Implementation Plan

**Not approved for implementation.** This is a future work breakdown preserved
from the feasibility phase, not evidence that any generic feature is implemented.
See [confirmed decisions](README.md) and [research evidence](feasibility.md).

## Architecture

```text
ZMK build export / optional Studio reads ----+
QMK build/source export / optional reads ----+--> validated keyboard profile
Manual annotations -------------------------+        |
                                                     v
                                         shared reference UI and views
                                                     ^
                                                     |
ZMK telemetry --> USB HID / optional BLE ----+--> normalized live state
QMK telemetry --> USB Raw HID --------------+
```

Keep imports, reference data and runtime state separate. A static reference must
remain usable without a connection, firmware extension or device ownership.
Use the simplest shared interfaces needed by actual adapters; avoid a general
plugin framework before there is a demonstrated requirement.

## Profile And State Requirements

A versioned profile should represent:

- Identity, provenance and keymap revision/fingerprint where available.
- Physical geometry, dimensions/rotation and stable logical position mappings.
- Layer identities, bindings and relationships, without fixed seven-layer limits.
- Recursive behavior definitions, combos and their scope/timing properties.
- Human annotations, reach instructions, labels, and optional named pointer modes.
- Explicit unknown/custom behavior information and private-content redaction.

Retain raw transparent bindings. Resolve an effective live key through the actual
active/default layer stack, not universally through BASE. Static layer preview
needs a clearly defined inherited-key context.

Normalized live state must distinguish unsupported, unknown and false/zero;
separate default layers from active layers where firmware semantics require it;
avoid imposing the legacy 32-bit mask as a universal app limit; and describe
capabilities explicitly. Handle device identity, transport status, protocol
version and profile mismatch separately.

Legacy Kairos44 cannot suddenly supply new fingerprints or capability handshakes:
its adapter must declare known capabilities and identify unverifiable profile
freshness without requiring a firmware change.

## Proposed Work Items And Dependencies

| ID | Work item | Prerequisites | Completion criterion |
| --- | --- | --- | --- |
| P1 | Define the versioned profile and normalized state contracts | Implementation approval; profile decisions below | Schema validation rejects invalid references and retains unsupported behavior information |
| P2 | Replace fixed geometry/data with a bundled Kairos44 profile | P1 | Current views and all curated Kairos44 assistance remain available without firmware changes |
| P3 | Generalize ZMK build export and annotation merge | P1 | Different key counts/layouts/layer names export deterministically; unsupported definitions are explicit |
| P4 | Add profile loading/selection and profile-scoped settings | P2, P3 | Reference browsing works offline; switching profiles resets incompatible selections safely |
| P5 | Add host device selection and versioned telemetry adapters | P1, P2 | Legacy Kairos44 v1 still works; multiple devices, permissions and reconnect errors are visible |
| P6 | Package an opt-in USB ZMK reporting module | P5 | Wired-only and split-central builds work without Bluetooth dependencies; legacy Kairos44 untouched |
| P7 | Add QMK profile import and annotations | P1, P4 | Known bindings map correctly; arbitrary callbacks remain annotated/unsupported rather than guessed |
| P8 | Add QMK USB reporting module/hooks | P5, P7 | Correct Raw HID framing and resolved state; existing hooks and VIA/Vial coexistence handled |
| P9 | Evaluate optional Studio discovery/profile reads | P3, P5 | Read-only integration handles lock/transport limitations and runtime profile drift |
| P10 | Add BLE and receiver adapters for selected targets | P5; applicable firmware module; hardware/platform decisions | Pairing, reconnection, receiver forwarding, latency and power gates pass on named targets |
| P11 | Document and package accepted support | Applicable phases and validation gates | Published support matrix names tested combinations and explicit limitations |

Recommended order is profile-driven Kairos44 parity, generic ZMK reference,
host adapters, ZMK USB, QMK reference/USB, then wireless. P9 is optional and not
a prerequisite for basic reference support. P11 can be completed incrementally
for each accepted target rather than waiting for every wireless configuration.

## Relevant Surfaces

- [UI keys](../../companion/src/keys.ts), [layers](../../companion/src/layers.ts),
  [layout](../../companion/src/layout.ts), [geometry](../../companion/src/geometry.ts)
  and [renderer](../../companion/src/components/Keyboard.tsx).
- [Application](../../companion/src/App.tsx), [store](../../companion/src/store.ts),
  settings, layer tabs, status strip, combo views and generated reference/manual.
- [ZMK exporter](../../scripts/generate_companion_keymap.py) and associated
  firmware verification fixtures.
- [Host reader](../../companion/src-tauri/src/keyboard.rs) and Tauri event/state
  integration; retain the existing protocol as a dedicated compatible adapter.
- Optional new firmware modules: locations/distribution are decisions below,
  not authorization to alter [existing telemetry](../../src/telemetry/).
- Permissions, packaging and documentation must reflect actual accepted
  platforms, not assumed cross-platform behavior.

## Behavior And Reliability Boundaries

- Reference/import and live reporting are separate capabilities.
- Start with state-only telemetry, changed-state/coalesced sends and snapshots.
  Do not introduce typed-text logging or physical-key-event collection by default.
- Live telemetry remains read-only except for safe snapshot/negotiation requests.
  Keymap editing, automatic flashing and remote keyboard control are out of scope.
- Explicitly report invalid profiles, unsupported protocols, access failures,
  stale data and connection failures; do not disguise them as valid empty state.
- Preserve manual browsing during disconnection and preserve current private
  macro redaction across imports, generated references and diagnostics.
- More layer/gesture/custom-state support must not silently change Kairos44's
  existing labels, pointer interpretation, shortcuts or follow behavior.

## Decisions Required Before The Relevant Phase

1. Choose profile schema/storage, import UX, stable IDs, annotation merge rules and
   static transparent-key preview semantics.
2. Select a differently shaped ZMK test board, a wired-only target and a QMK board;
   establish representative custom behaviors and layout mappings.
3. Choose supported firmware revisions and distribution for optional modules
   (repository-local prototype versus separately versioned external modules).
4. Define the new protocol framing, capability/version negotiation, device/profile
   matching and bounded payload strategy. Do not force 16- and 32-byte adapters
   into identical packets.
5. Set measurable latency, power and reconnect acceptance thresholds before
   hardware testing. Research did not establish numerical budgets.
6. Decide QMK VIA/Vial coexistence and which dynamic keymap sources to support.
7. Select OS/BLE stacks, wireless hardware/forks/receivers and pairing policy
   before promising wireless or Windows/macOS support.
8. Decide whether optional advanced runtime behavior instrumentation is wanted;
   it is not part of preserving current assistance features.

Each implemented phase must satisfy the corresponding
[validation gates](validation-plan.md). Record newly approved decisions and
evidence in these repository documents so later sessions can continue safely.
