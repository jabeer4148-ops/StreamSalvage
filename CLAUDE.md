## StreamSalvage

Desktop MP4 crash-recovery app. Tauri 2 (Rust backend) + React + TypeScript + Tailwind. Bundles FFmpeg as a sidecar binary at `binaries/ffmpeg`.

### Project structure

```
src/                      React frontend
  App.tsx                 Root component — step-based renderer
  hooks/useRepair.ts      All repair state via useReducer (the god hook)
  lib/tauriCommands.ts    Typed IPC wrappers (invoke + dialog plugin)
  types/index.ts          AppStep, RepairState, TauriRepairResult
  components/
    DropZone.tsx           File drop/click target (broken or reference variant)
    StepTabs.tsx           Progress indicator
    ReferenceExplainer.tsx Explains what a reference file is
    NoReferenceWarning.tsx Skip-reference toggle
    RepairProgress.tsx     Live progress bar + log
    VideoPreview.tsx       Preview repaired output
    ExportPanel.tsx        Save + license validation UI

src-tauri/src/main.rs     Rust backend — all 5 Tauri commands
src-tauri/tauri.conf.json App config (780×620 fixed window, ffmpeg sidecar)
```

### Repair flow

`broken` → `reference` → `repairing` → `preview` → `export`

- **No reference**: FFmpeg stream copy (`-c copy -avoid_negative_ts make_zero`) — ~40% success
- **With reference**: 3-step — stream copy, probe reference streams, re-mux broken data using reference container — ~85% success

### Tauri commands (Rust → frontend)

| Command | Purpose |
|---|---|
| `repair_no_reference` | FFmpeg stream copy, single attempt |
| `repair_with_reference` | 3-step reference-guided repair |
| `validate_license` | Lemon Squeezy `/v1/licenses/validate` |
| `open_file_in_player` | `cmd /c start` on Windows |
| `save_repaired_file` | `std::fs::copy` to user destination |

### Key notes

- License validation uses Lemon Squeezy. `LS_PRODUCT_ID` env var must be set for production; defaults to `"YOUR_PRODUCT_ID"`.
- Output file is written next to the broken file as `{stem}_recovered.mp4`.
- Progress bar during repair is simulated (90% over 3 s); jumps to 100% on success.

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
