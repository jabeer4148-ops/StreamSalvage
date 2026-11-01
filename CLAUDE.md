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

src-tauri/src/main.rs     Rust backend — all 9 Tauri commands
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
| `validate_license` | POST `{ licenseKey }` to `https://streamsalvage.com/api/validate-license` |
| `get_stored_license` / `save_stored_license` / `clear_stored_license` | Read / write / delete `%APPDATA%\StreamSalvage\license.json` |
| `open_file_in_player` | `cmd /c start` on Windows (the UI only ever passes the 30 s preview clip) |
| `save_repaired_file` | `std::fs::copy` from the work folder to the user's destination; refuses without a stored license |
| `cleanup_work_files` | Empties the private work folder (called on reset and at app start) |

### Key notes

- Payments: Stripe Checkout from the landing site (`landing/pages/api/create-checkout.js`). The Stripe webhook (`api/webhook.js`) generates a `SS-XXXXXXXX-XXXXXXXX-XXXXXXXX-XXXXXXXX` key, stores it in Upstash Redis and emails it via Brevo. The app validates keys against `api/validate-license.js`. No payment secrets are compiled into the app; `STREAMSALVAGE_LICENSE_API_URL` (build time) can override the endpoint. Debug builds without it accept any `TEST-` key.
- Repairs are written to the private work folder (`app_local_data_dir()/work/{stem}_recovered.mp4`), never next to the broken file. On success FFmpeg also cuts `{stem}_recovered_preview.mp4` (`-t 30 -c copy`); that clip is the free preview. The full file only reaches the user via `save_repaired_file` after license validation. This is the paywall — do not reintroduce writing next to the input.
- Progress bar during repair is simulated (90% over 3 s); jumps to 100% on success.

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
