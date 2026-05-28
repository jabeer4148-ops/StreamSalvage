# Architecture

StreamSalvage is a Tauri 2 desktop app — Rust process manages FFmpeg, React UI drives the user through a repair wizard.

## Component overview

```
┌─────────────────────────────────────────────┐
│  React (Vite, port 1420 in dev)             │
│                                             │
│  App.tsx ──── useRepair (useReducer)        │
│    │              │                         │
│    │         tauriCommands.ts               │
│    │         (invoke / dialog plugin)       │
│    │                                        │
│  StepTabs  DropZone  RepairProgress  ...   │
└──────────────────┬──────────────────────────┘
                   │ IPC (Tauri invoke)
┌──────────────────▼──────────────────────────┐
│  Rust (src-tauri/src/main.rs)               │
│                                             │
│  repair_no_reference                        │
│  repair_with_reference                      │
│  validate_license  (Lemon Squeezy API)      │
│  open_file_in_player                        │
│  save_repaired_file                         │
│                                             │
│  get_ffmpeg_path()  ──►  binaries/ffmpeg   │
└─────────────────────────────────────────────┘
```

## Data flow

1. User selects broken file → `pickBrokenFile()` (dialog plugin) → `SET_BROKEN_FILE` action → step advances to `reference`
2. User selects reference file (optional) or skips → step stays on `reference`
3. `startRepair()` dispatches `START_REPAIR`, invokes `repair_no_reference` or `repair_with_reference`
4. Rust runs FFmpeg sidecar, returns `RepairResult { success, output_path, log, error }`
5. On success → `REPAIR_SUCCESS` → step `preview`; on failure → `REPAIR_FAILED` → back to `reference`
6. Preview step: open in system player or proceed to `export`
7. Export step: `pickSaveLocation` → `saveRepairedFile` (fs::copy)

## State machine (`AppStep`)

```
broken → reference → repairing → preview → export
                  ↑____ (on REPAIR_FAILED) __|
```

All state lives in `useRepair` (single `useReducer`). No global store, no context.

## Entry points

- Frontend: [src/main.tsx](src/main.tsx) mounts `<App />`
- Backend: [src-tauri/src/main.rs](src-tauri/src/main.rs) `fn main()` registers all commands

## Key constraints

- Window is fixed 780×620, non-resizable.
- FFmpeg is bundled via `bundle.externalBin` — not fetched at runtime.
- Output file lands next to the broken file (`{stem}_recovered.mp4`). No temp directory.
- Progress bar is simulated; FFmpeg has no progress IPC yet.
