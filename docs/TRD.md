# StreamSalvage — Technical Requirements Document
Version: 1.0.0

---

## 1. System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    React Frontend (Vite)                        │
│                     localhost:1420 (dev)                        │
│                                                                 │
│  src/main.tsx                                                   │
│      └── <App />                                                │
│           ├── useRepair()  [useReducer state machine]           │
│           └── Components                                        │
│                ├── StepTabs.tsx                                 │
│                ├── DropZone.tsx                                 │
│                ├── ReferenceExplainer.tsx                       │
│                ├── NoReferenceWarning.tsx                       │
│                ├── RepairProgress.tsx                           │
│                ├── VideoPreview.tsx                             │
│                └── ExportPanel.tsx                              │
│                                                                 │
│  src/lib/tauriCommands.ts  [typed invoke wrappers]              │
└──────────────────────┬──────────────────────────────────────────┘
                       │ Tauri IPC (invoke / @tauri-apps/api)
                       │ Dialog plugin (@tauri-apps/plugin-dialog)
┌──────────────────────▼──────────────────────────────────────────┐
│                  Rust Backend (Tauri 2)                         │
│                  src-tauri/src/main.rs                          │
│                                                                 │
│  Commands registered:                                           │
│  ├── repair_no_reference(app, broken_path)                      │
│  ├── repair_with_reference(app, broken_path, reference_path)    │
│  ├── validate_license(license_key)                              │
│  ├── open_file_in_player(path)                                  │
│  └── save_repaired_file(source_path, destination_path)          │
│                                                                 │
│  Helper functions:                                              │
│  ├── get_ffmpeg_path(app) → PathBuf                             │
│  ├── output_is_valid(output) → bool                             │
│  └── recovered_output_path(input_path) → PathBuf               │
└──────────┬────────────────────────────────┬────────────────────┘
           │                                │
           ▼                                ▼
┌──────────────────────┐    ┌───────────────────────────────────┐
│ FFmpeg subprocess    │    │ Lemon Squeezy API                 │
│ (bundled binary)     │    │ POST /v1/licenses/validate        │
│                      │    │ (validate_license command only)   │
│ binaries/            │    └───────────────────────────────────┘
│ ffmpeg-x86_64-       │
│ pc-windows-msvc.exe  │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│ Local File System    │
│                      │
│  Read:  broken.mp4   │
│  Read:  reference.mp4│
│  Write: *_recovered  │
│         .mp4         │
└──────────────────────┘
```

**License validation flow:**
```
ExportPanel.tsx
  └── onCheckLicense(key)  [prop from App.tsx]
       └── checkLicense(key)  [useRepair.ts]
            └── validateLicense(key)  [tauriCommands.ts]
                 └── invoke('validate_license', { licenseKey })
                      └── validate_license(license_key)  [Rust]
                           ├── If LEMON_SQUEEZY_API_KEY is empty:
                           │    return Ok(license_key.starts_with("TEST-"))
                           └── POST https://api.lemonsqueezy.com/v1/licenses/validate
                                └── json["valid"].as_bool() → bool → JS → dispatch(LICENSE_VALID/INVALID)
```

---

## 2. Technology Stack

| Layer | Technology | Version |
|---|---|---|
| Frontend framework | React | 18.3.1 (exact) |
| Frontend types | @types/react | 18.3.29 |
| Language | TypeScript | ~5.8.3 |
| Build tool | Vite | ^7.0.4 |
| React plugin | @vitejs/plugin-react | ^4.6.0 |
| Styling | Tailwind CSS | ^3.4.19 |
| CSS post-processing | PostCSS | ^8.5.15 |
| CSS vendor prefixing | Autoprefixer | ^10.5.0 |
| Desktop framework | Tauri | ^2 (runtime + CLI) |
| Tauri dialog plugin | @tauri-apps/plugin-dialog | ^2.7.1 |
| Tauri API | @tauri-apps/api | ^2 |
| Rust crate: Tauri | tauri | ^2 |
| Rust crate: dialog | tauri-plugin-dialog | ^2 |
| Rust crate: shell | tauri-plugin-shell | ^2 |
| Rust crate: opener | tauri-plugin-opener | ^2 (in Cargo.toml; unused in main.rs) |
| Rust crate: HTTP client | reqwest | ^0.11 (json feature only) |
| Rust crate: async runtime | tokio | ^1 (full features) |
| Rust crate: serialization | serde | ^1 (derive feature) |
| Rust crate: JSON | serde_json | ^1 |
| Rust crate: UUID | uuid | ^1 (v4 feature; in Cargo.toml, unused in main.rs) |
| Build script | tauri-build | ^2 |
| Video processing | FFmpeg static binary | ffmpeg-x86_64-pc-windows-msvc.exe (Git LFS) |
| Payments | Lemon Squeezy | API v1 |

---

## 3. Rust Backend — Command Specifications

### 3.1 `repair_no_reference`

```
JS invoke: invoke('repair_no_reference', { brokenPath: string })
Rust sig:  async fn repair_no_reference(app: AppHandle, broken_path: String) -> Result<RepairResult, String>
Returns:   RepairResult { success: bool, output_path: Option<String>, log: Vec<String>, error: Option<String> }
```

**Input validation:**
1. File must exist at `broken_path` — returns `success: false, error: "File not found"` if not
2. File must be ≥ 1,048,576 bytes (1 MB) — returns `success: false, error: "File too small..."` if not

**Business logic:**
1. Resolve FFmpeg binary path via `get_ffmpeg_path()`
2. Compute output path: `{stem}_recovered.mp4` in same directory as input
3. Run FFmpeg: `ffmpeg -y -i <broken_path> -c copy -avoid_negative_ts make_zero <output>`
4. Check success: `result.status.success() && output_is_valid(output)` (output exists AND > 1,024 bytes)
5. Return `RepairResult` with full stderr appended to log

**Error conditions:**
- FFmpeg binary not found → `Result::Err(String)` (Tauri maps to invoke rejection)
- `Command::new` fails → `map_err` returns `Err`
- File doesn't exist → early `Ok(RepairResult { success: false })`
- File < 1 MB → early `Ok(RepairResult { success: false })`
- FFmpeg exits non-zero or output invalid → `Ok(RepairResult { success: false })`

**Side effects:** Writes `{stem}_recovered.mp4` to the same directory as the broken file.

---

### 3.2 `repair_with_reference`

```
JS invoke: invoke('repair_with_reference', { brokenPath: string, referencePath: string })
Rust sig:  async fn repair_with_reference(app: AppHandle, broken_path: String, reference_path: String) -> Result<RepairResult, String>
Returns:   RepairResult
```

**Input validation:**
1. `broken_path` file must exist — returns early on failure
2. `reference_path` file must exist — returns early on failure
3. `broken_path == reference_path` is rejected with error "Broken file and reference file cannot be the same file."
4. Broken file must be ≥ 1,048,576 bytes

**Business logic — 3 sequential strategies (returns on first success):**

**Strategy 1 — Stream copy with faststart:**
```
ffmpeg -y -i <broken> -c copy -avoid_negative_ts make_zero -movflags +faststart <output>
```
Returns immediately if output is valid.

**Strategy 2 — Reference container remap:**
```
ffmpeg -y -i <reference> -i <broken> -map 1:v? -map 1:a? -c copy
       -avoid_negative_ts make_zero -movflags +faststart <output>
```
Uses the reference file's container metadata to help re-map broken file streams. `-map 1:v?` and `-map 1:a?` map video/audio from the second input (broken) optionally. Returns immediately if output is valid.

**Strategy 3 — Fallback with timestamp regeneration:**
```
ffmpeg -y -fflags +genpts -err_detect ignore_err -i <broken>
       -map 0:v? -map 0:a? -c copy -avoid_negative_ts make_zero -movflags +faststart <output>
```
Regenerates PTS timestamps (`+genpts`) and ignores decode errors (`ignore_err`). Falls back to mapping directly from the broken file.

**Error conditions:** Same as `repair_no_reference` plus: both-same-file guard, reference-not-found guard.

**Side effects:** Writes `{stem}_recovered.mp4` to the same directory as the broken file.

---

### 3.3 `validate_license`

```
JS invoke: invoke('validate_license', { licenseKey: string })
Rust sig:  async fn validate_license(license_key: String) -> Result<bool, String>
Returns:   bool
```

**Business logic:**
1. Read `LEMON_SQUEEZY_API_KEY` from runtime environment (`std::env::var`)
2. If empty: return `Ok(license_key.starts_with("TEST-"))` (dev bypass)
3. If set: POST to `https://api.lemonsqueezy.com/v1/licenses/validate`
   - Headers: `Authorization: Bearer {api_key}`, `Accept: application/json`, `Content-Type: application/json`
   - Body: `{ "license_key": "<key>", "instance_name": "StreamSalvage-Desktop" }`
4. If HTTP response is not 2xx: return `Ok(false)`
5. Parse JSON body: return `json["valid"].as_bool().unwrap_or(false)`

**Error conditions:**
- Network error → `Err(String)` — JS side catches and returns `false`
- Non-2xx HTTP → `Ok(false)`
- JSON parse error → `Err(String)`

**Side effects:** Single outbound HTTP POST. No file operations. No state persisted.

---

### 3.4 `open_file_in_player`

```
JS invoke: invoke('open_file_in_player', { path: string })
Rust sig:  async fn open_file_in_player(path: String) -> Result<(), String>
Returns:   ()
```

**Business logic:**
- Windows only (`#[cfg(target_os = "windows")]`): spawns `cmd /c start "" <path>`
- Opens the file in the system default media player (non-blocking `spawn`)

**Error conditions:** `spawn` fails → `map_err(|e| e.to_string())` returns `Err`

**Side effects:** Launches external process. Returns immediately (does not wait for player to close).

⚠️ ASSUMPTION: The non-Windows branches (`#[cfg]` gates) fall through silently — the function returns `Ok(())` on macOS/Linux without doing anything. This is consistent with Windows-only shipping.

---

### 3.5 `save_repaired_file`

```
JS invoke: invoke('save_repaired_file', { sourcePath: string, destinationPath: string })
Rust sig:  async fn save_repaired_file(source_path: String, destination_path: String) -> Result<(), String>
Returns:   ()
```

**Business logic:** `std::fs::copy(&source_path, &destination_path)` — copies repaired output to user-chosen destination.

**Error conditions:** File system errors (permissions, disk full, invalid path) → `Err("Copy failed: {e}")`

**Side effects:** Writes a copy of the repaired file to `destination_path`. Source file is preserved.

---

## 4. Frontend State Machine

**Managed by:** `useReducer` in `src/hooks/useRepair.ts`

**Initial state:**
```typescript
{
  step: 'broken',
  brokenFilePath: null,
  referenceFilePath: null,
  hasReferenceFile: false,
  skippedReference: false,
  repairProgress: 0,
  repairLog: [],
  repairedFilePath: null,
  repairSuccess: false,
  repairError: null,
  licenseKey: null,
  licenseValid: false,
  showExport: false,
}
```

**State transitions:**

| Action | Trigger | Before → After `step` | Key state changes |
|---|---|---|---|
| `SET_BROKEN_FILE` | User selects file via dialog | `broken` → `reference` | `brokenFilePath = path`, `repairError = null` |
| `SET_REFERENCE_FILE` | User selects reference via dialog | `reference` → `reference` | `referenceFilePath = path`, `hasReferenceFile = true`, `skippedReference = false` |
| `SKIP_REFERENCE` | User clicks "I don't have a reference file" | `reference` → `reference` | `referenceFilePath = null`, `hasReferenceFile = false`, `skippedReference = true` |
| `UNDO_SKIP` | User clicks "Skipped - undo?" | `reference` → `reference` | `skippedReference = false` |
| `START_REPAIR` | User clicks "Start Repair" | `reference` → `repairing` | `repairProgress = 0`, `repairLog = []`, `repairError = null`, `repairSuccess = false` |
| `REPAIR_PROGRESS` | setInterval tick (100ms) | `repairing` → `repairing` | `repairProgress += 3` (capped 90), optional log message appended |
| `REPAIR_SUCCESS` | FFmpeg returns success | `repairing` → `preview` | `repairedFilePath = outputPath`, `repairProgress = 100`, `repairSuccess = true` |
| `REPAIR_FAILED` | FFmpeg returns failure or throws | `repairing` → `reference` | `repairError = error`, `repairProgress = 0`, log appended |
| `SHOW_EXPORT` | User clicks "Unlock full video →" | `preview` → `export` | `showExport = true` |
| `LICENSE_VALID` | Lemon Squeezy returns `valid: true` | any → `export` | `licenseKey = key`, `licenseValid = true`, `showExport = true` |
| `LICENSE_INVALID` | Lemon Squeezy returns `valid: false` | `export` → `export` | `licenseValid = false` |
| `RESET` | "Start over" or "Repair another file" | any → `broken` | All fields reset to `initialState` |

**Race condition guard:** `repairRunIdRef` is incremented on each new repair start and on reset. Async callbacks (FFmpeg result, progress timer) check their captured `repairRunId` against `repairRunIdRef.current` before dispatching — stale results from a cancelled repair are silently discarded.

---

## 5. FFmpeg Integration

**Binary name:** `ffmpeg-x86_64-pc-windows-msvc.exe`
**Location in repo:** `src-tauri/binaries/ffmpeg-x86_64-pc-windows-msvc.exe` (Git LFS)
**Bundle configuration:** `tauri.conf.json` → `bundle.externalBin: ["binaries/ffmpeg"]`

**Path resolution strategy** (`get_ffmpeg_path` in `main.rs`, 4 strategies in order):

1. **Tauri Resource directory** — `app.path().resolve("binaries/ffmpeg", BaseDirectory::Resource)` → check for `ffmpeg-x86_64-pc-windows-msvc.exe` then `ffmpeg.exe`
2. **CWD-relative paths** — `binaries/ffmpeg-x86_64-pc-windows-msvc.exe` then `../src-tauri/binaries/...`
3. **Executable-relative paths** — 5 paths relative to the running `.exe` location, covering installed and portable layouts
4. **Cargo manifest directory** — `CARGO_MANIFEST_DIR/binaries/ffmpeg-x86_64-pc-windows-msvc.exe` (dev-time fallback)

If all 4 strategies fail, returns `Err` with message: "FFmpeg binary not found. Tried multiple locations. Please ensure src-tauri/binaries/ffmpeg-x86_64-pc-windows-msvc.exe exists and Git LFS files are pulled (run: git lfs pull)"

**Output validity check** (`output_is_valid`):
```rust
output.exists() && output.metadata().map(|m| m.len()).unwrap_or(0) > 1024
```

**Output naming** (`recovered_output_path`):
```rust
{input_stem}_recovered.mp4  // written in same directory as input
```

**FFmpeg args reference table:**

| Strategy | Key args | Purpose |
|---|---|---|
| No-ref stream copy | `-c copy -avoid_negative_ts make_zero` | Copy streams, reset negative timestamps |
| Ref step 1 | `-c copy -avoid_negative_ts make_zero -movflags +faststart` | Same + move MOOV to front |
| Ref step 2 | `-i ref -i broken -map 1:v? -map 1:a? -c copy -avoid_negative_ts make_zero -movflags +faststart` | Use reference container, map streams from broken |
| Ref step 3 | `-fflags +genpts -err_detect ignore_err -map 0:v? -map 0:a? -c copy -avoid_negative_ts make_zero -movflags +faststart` | Regenerate PTS, ignore decode errors |

---

## 6. License Validation

| Property | Value |
|---|---|
| Provider | Lemon Squeezy |
| Endpoint | `POST https://api.lemonsqueezy.com/v1/licenses/validate` |
| Auth header | `Authorization: Bearer {LEMON_SQUEEZY_API_KEY}` |
| Accept header | `Accept: application/json` |
| Content-Type | `Content-Type: application/json` |
| Request body | `{ "license_key": "<key>", "instance_name": "StreamSalvage-Desktop" }` |
| Response field | `json["valid"]` as bool (defaults to `false` on missing/null) |
| Non-2xx handling | Returns `Ok(false)` — not treated as a hard error |
| Network error | Returns `Err(String)` — JS catches and returns `false`, displays "Could not verify license - check your internet connection" |

**API key embedding (build.rs):**
```rust
if let Ok(key) = std::env::var("LEMON_SQUEEZY_API_KEY") {
    println!("cargo:rustc-env=LEMON_SQUEEZY_API_KEY={}", key);
}
```
The key is read from the build environment at compile time and embedded into the binary. At runtime, `std::env::var("LEMON_SQUEEZY_API_KEY")` reads the embedded value.

⚠️ ASSUMPTION: The `cargo:rustc-env` output from `build.rs` causes Cargo to set the env var at compile time, making it readable at runtime via `env!()` or `std::env::var()`. In practice, `std::env::var()` at runtime reads the *process* environment, not the compile-time value. The `build.rs` line as written is only effective if the application is compiled with the env var set — which works correctly in CI/CD but the runtime `std::env::var()` call reads the ambient process environment, not the embedded value. This means the binary does **not** have the key baked in; the key must be present in the runtime environment or set via another mechanism. This warrants investigation before production release.

**Dev mode bypass:** When `LEMON_SQUEEZY_API_KEY` is absent from the environment, any key starting with `"TEST-"` returns `Ok(true)`. The ExportPanel renders a hint message in `import.meta.env.DEV` builds only.

---

## 7. Security Considerations

| Area | Implementation |
|---|---|
| API key storage | Passed via build-time env var; see ⚠️ note in §6 |
| User data | No user data, file paths, or keys persisted to disk |
| Network | Only outbound call is license validation POST; no inbound ports |
| File operations | FFmpeg reads input files; writes only `_recovered.mp4` adjacent to input; `save_repaired_file` writes to user-chosen path |
| CSP | `"csp": null` in `tauri.conf.json` — Content Security Policy disabled |
| Capabilities | Minimal: dialog, shell-execute, shell-open, opener, path-resolve |

**Capability permissions breakdown** (`capabilities/default.json`):

| Permission | Why granted |
|---|---|
| `core:default` | Base Tauri APIs (app metadata, events) |
| `core:path:allow-resolve` | `get_ffmpeg_path` resolves resource directory |
| `shell:allow-execute` | Spawn FFmpeg subprocess |
| `shell:allow-open` | Open repaired file in system media player |
| `dialog:allow-open` | File picker for broken and reference files |
| `dialog:allow-save` | Save dialog for export destination |
| `opener:default` | Open URLs (checkout link) and files |

**Note:** `"csp": null` disables Content Security Policy entirely. For a desktop app with no remote web content this is acceptable, but should be reviewed if any remote content is ever loaded.

---

## 8. Build & Release

**Development:**
```bash
npm install
npm run tauri dev    # runs: vite (port 1420) + cargo tauri dev
```

**Production build:**
```bash
npm run tauri build  # runs: tsc && vite build, then cargo tauri build
```

**Output artifacts** (from `bundle.targets: "all"` on Windows):
- `src-tauri/target/release/streamsalvage.exe` — standalone executable
- `src-tauri/target/release/bundle/msi/StreamSalvage_1.0.0_x64_en-US.msi` — MSI installer
- `src-tauri/target/release/bundle/nsis/StreamSalvage_1.0.0_x64-setup.exe` — NSIS installer

⚠️ ASSUMPTION: Exact artifact filenames follow Tauri 2 conventions; not verified from build output.

**Code signing:** ⚠️ ASSUMPTION — No signing configuration was found in `tauri.conf.json` or any other config file in the read set. Signing is not yet configured in the repository.

**Distribution:** GitHub Releases (`https://github.com/jabeer4148-ops/StreamSalvage/releases` — from landing page CTA).

---

## 9. Dependencies & Licenses

**npm packages (key):**

| Package | License |
|---|---|
| react, react-dom | MIT |
| vite | MIT |
| typescript | Apache-2.0 |
| tailwindcss | MIT |
| @tauri-apps/api | MIT OR Apache-2.0 |
| @tauri-apps/plugin-dialog | MIT OR Apache-2.0 |

**Rust crates (key):**

| Crate | License |
|---|---|
| tauri | MIT OR Apache-2.0 |
| tauri-plugin-dialog | MIT OR Apache-2.0 |
| tauri-plugin-shell | MIT OR Apache-2.0 |
| serde | MIT OR Apache-2.0 |
| tokio | MIT |
| reqwest | MIT OR Apache-2.0 |
| serde_json | MIT OR Apache-2.0 |

**FFmpeg (critical):**
- License: LGPL 2.1+ (for the libraries) / GPL 2+ (if GPL components enabled in the build)
- Compliance path: FFmpeg is shipped as a **separate static executable** (`ffmpeg-x86_64-pc-windows-msvc.exe`), not dynamically linked into the Rust binary. This separation satisfies LGPL "not embedding" requirements.
- ⚠️ ASSUMPTION: The exact build configuration of the bundled FFmpeg binary is not in the repository. LGPL compliance requires that users can replace the FFmpeg binary. This should be documented in the EULA/license page.
