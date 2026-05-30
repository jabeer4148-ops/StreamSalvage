# StreamSalvage Documentation

Generated from full codebase read on 2026-05-30. All documents are derived from actual source code — no assumptions about unread files.

| Document | Description | Key Contents |
|---|---|---|
| [PRD.md](PRD.md) | Product Requirements Document | Executive summary, user stories, functional requirements (FR-001–041), non-functional requirements, success metrics, constraints |
| [TRD.md](TRD.md) | Technical Requirements Document | Architecture diagram, full tech stack with versions, all 5 Rust command specs, state machine documentation, FFmpeg integration, license validation, security, build & release |
| [APP_FLOW.md](APP_FLOW.md) | Application Flow Document | Complete happy path (17 steps), full state transition diagram, per-screen specification (all 5 screens), all error states with triggers/messages/recovery, all edge cases |
| [UI_UX_BRIEF.md](UI_UX_BRIEF.md) | UI/UX Design Brief | Design philosophy, complete color palette (all hex values), component inventory with props and state classes, ASCII screen layouts, every UX decision with rationale, accessibility notes, all UI copy |
| [BACKEND_SCHEMA.md](BACKEND_SCHEMA.md) | Backend Schema & Data Structures | Rust structs, TypeScript types, IPC command contracts (all 5), full reducer schema, environment variables, file system operations, external API contracts |
| [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md) | Implementation Plan & Release Checklist | Complete feature inventory, pre-launch findings (critical bugs + verify items), launch checklist, known limitations, v1.1+ roadmap, 7 architecture decision records |

## Sections flagged with ⚠️ ASSUMPTION

The following assumptions were made where code alone was insufficient:

| Document | Section | Assumption |
|---|---|---|
| PRD | §9 Constraints | FFmpeg installer size estimated as 60–120 MB (binary not measured) |
| PRD | §9 Constraints | `uuid` and `tauri-plugin-opener` are unused — may be reserved for future use |
| TRD | §3.4 `open_file_in_player` | Non-Windows branches return `Ok(())` silently (by `#[cfg]` gate logic) |
| TRD | §6 License Validation | `cargo:rustc-env` in `build.rs` does NOT make key available via `std::env::var()` at runtime — this is a likely bug |
| TRD | §8 Build & Release | Artifact filenames follow Tauri 2 naming conventions (not verified from actual build output) |
| TRD | §8 Build & Release | No code signing configuration found in repo — assumed not yet configured |
| TRD | §9 Licenses | FFmpeg binary build configuration not in repo — LGPL compliance assumes binary is separately distributable |

## Quick reference

**Rust commands:** `repair_no_reference` · `repair_with_reference` · `validate_license` · `open_file_in_player` · `save_repaired_file`

**App steps:** `broken` → `reference` → `repairing` → `preview` → `export`

**Key files:**
- Entry point: `src/main.tsx`
- State machine: `src/hooks/useRepair.ts`
- IPC layer: `src/lib/tauriCommands.ts`
- Rust backend: `src-tauri/src/main.rs`
- Types: `src/types/index.ts`

**Repair success rates:** ~40% without reference file · ~85% with reference file

**Price:** $29 one-time via [Lemon Squeezy](https://streamsalvage.lemonsqueezy.com/buy/)
