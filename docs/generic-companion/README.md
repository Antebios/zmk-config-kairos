# Generic Keyboard Companion Planning

This directory preserves the feasibility research and proposed future work for
generalizing the [Kairos44 companion](../../companion/README.md) to other ZMK
and QMK keyboards. Research snapshot: 2026-11-01.

**Status: feasibility assessment complete; application and firmware implementation
not started or authorized.** Saving this documentation does not approve the
future implementation phases.

## Confirmed Scope And Decisions

- Retain all current companion features: layer reference, gesture explanations,
  combos and highlighting, three views, filtering, window controls, CLI control,
  embedded manual, and current live status.
- Optional firmware modules are acceptable.
- Preserve the current working Kairos44 firmware unchanged, including its USB v1
  reporting interface. Do not enable Studio, change BLE services, upgrade pinned
  firmware, or flash the keyboard as part of generalization without approval.
- Support imported reference profiles without telemetry. Authoritative live state
  requires a compatible reporting interface.
- "Generic" means profile-based support with explicit capabilities, not guaranteed
  plug-and-play with every untouched ZMK/QMK keyboard.
- Detailed live tap-dance progress and macro execution are possible extensions,
  not existing features that must be preserved.
- The Kairos44 app now has optional, default-off layer-change peeks with a saved,
  adjustable 5-second default. This is a current-app enhancement, not approval
  to begin generic application/profile/adapter implementation. Preserve it in
  future parity work; see [layer-peek findings and planning](layer-peek.md).

## Documents

| Document | Purpose |
| --- | --- |
| [Feasibility assessment](feasibility.md) | Inspected source coupling, compatibility matrix, firmware/driver requirements, upstream evidence and limitations |
| [Future implementation plan](implementation-plan.md) | Recommended architecture, phased work items, dependencies, acceptance criteria and unresolved decisions |
| [Validation plan](validation-plan.md) | Required application, import, protocol, platform, hardware and privacy checks |
| [Layer-peek findings and planning](layer-peek.md) | Current Kairos44 behavior, reusable boundaries and future generic acceptance criteria |

The documents are self-contained repository work products; they do not depend on
the original chat, session database, absolute local paths or generated build
artifacts. They supersede the session-only assessment as the continuation entry
point, including its formerly unanswered firmware-policy question.

## Continuing On Another Computer Or Session

1. Publish these files through an explicit Git commit and push, or transfer the
   working tree including untracked files. Saving files locally does not publish
   them; no commit or push is implied by this documentation task.
2. On the other computer, check the branch and `git status --short`, then read this
   page and the linked documents before changing anything.
3. Use the [repository guide](../repository-guide.md) and
   [existing session handoff](../session-handoff.md) for build-workspace setup.
   Reinspect current source and pinned dependencies; the research is a snapshot.
4. Resolve the open decisions in the implementation plan and obtain explicit
   implementation approval. Start with the profile-driven UI, not firmware changes.
5. Record approved decisions, completed work and validation evidence here as work
   progresses. Do not mark proposed support as shipped or hardware-tested.

## Research Completed

The assessment inspected the UI data, geometry, compiled-keymap exporter, host
device reader and firmware telemetry producer, and checked official upstream
ZMK Studio and QMK documentation/protocol definitions. It did not implement,
build, flash or hardware-test generic keyboard support.
