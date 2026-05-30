# StreamSalvage — Backend Schema & Data Structures

---

## 1. Rust Data Structures

### `RepairResult` (`src-tauri/src/main.rs`, line 8–14)

```rust
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct RepairResult {
    pub success: bool,
    pub output_path: Option<String>,
    pub log: Vec<String>,
    pub error: Option<String>,
}
```

| Field | Type | Description |
|---|---|---|
| `success` | `bool` | `true` if repair produced a valid output file (exists AND > 1,024 bytes) |
| `output_path` | `Option<String>` | Absolute path to `{stem}_recovered.mp4`; `None` on failure |
| `log` | `Vec<String>` | Ordered log lines including FFmpeg stderr, step messages, and path debug info |
| `error` | `Option<String>` | Human-readable error message; `None` on success |

**Derive macros applied:**
- `Debug` — for Rust-side logging
- `Serialize` — for JSON serialization over Tauri IPC
- `Deserialize` — for potential future IPC direction
- `Clone` — for safe passing between async boundaries

**Serialization:** Serde serializes `Option<T>` as JSON `null` when `None`, and `Vec<String>` as a JSON array. Field names are serialized as-is (snake_case) — Tauri does NOT auto-convert field names, only command parameter names.

**Usage context:** Returned by `repair_no_reference` and `repair_with_reference` commands as `Result<RepairResult, String>`. On the `Err` branch, Tauri serializes the error string as a rejected Promise on the JS side.

---

### Helper functions (not public structs)

These are module-private functions used internally:

```rust
fn get_ffmpeg_path(app: &tauri::AppHandle) -> Result<PathBuf, String>
fn output_is_valid(output: &Path) -> bool
fn recovered_output_path(input_path: &str) -> PathBuf
```

| Function | Logic |
|---|---|
| `output_is_valid` | Returns `output.exists() && output.metadata().map(\|m\| m.len()).unwrap_or(0) > 1024` |
| `recovered_output_path` | Returns `{input_directory}/{stem}_recovered.mp4` |
| `get_ffmpeg_path` | 4-strategy path resolution; see TRD §5 |

---

## 2. TypeScript Type Definitions

### `AppStep` (`src/types/index.ts`, line 1)

```typescript
export type AppStep = 'broken' | 'reference' | 'repairing' | 'preview' | 'export';
```

| Value | Screen rendered | Entry trigger |
|---|---|---|
| `'broken'` | DropZone for broken file | Initial state; after RESET |
| `'reference'` | DropZone for reference file + ReferenceExplainer | After SET_BROKEN_FILE; after REPAIR_FAILED |
| `'repairing'` | RepairProgress progress bar + log | After START_REPAIR |
| `'preview'` | VideoPreview success screen | After REPAIR_SUCCESS |
| `'export'` | ExportPanel license + save | After SHOW_EXPORT or LICENSE_VALID |

**Rust counterpart:** None — step is frontend-only state. The Rust backend is stateless.

---

### `RepairState` (`src/types/index.ts`, lines 3–17)

```typescript
export interface RepairState {
  step: AppStep;
  brokenFilePath: string | null;
  referenceFilePath: string | null;
  hasReferenceFile: boolean;
  skippedReference: boolean;
  repairProgress: number;
  repairLog: string[];
  repairedFilePath: string | null;
  repairSuccess: boolean;
  repairError: string | null;
  licenseKey: string | null;
  licenseValid: boolean;
  showExport: boolean;
}
```

| Field | Type | Default | Description |
|---|---|---|---|
| `step` | `AppStep` | `'broken'` | Current screen/step |
| `brokenFilePath` | `string \| null` | `null` | Absolute path to corrupted file |
| `referenceFilePath` | `string \| null` | `null` | Absolute path to reference file |
| `hasReferenceFile` | `boolean` | `false` | True when reference file selected AND not subsequently skipped |
| `skippedReference` | `boolean` | `false` | True when user clicked "I don't have a reference file" |
| `repairProgress` | `number` | `0` | Simulated progress 0–100; driven by setInterval + FFmpeg completion |
| `repairLog` | `string[]` | `[]` | Accumulated log lines shown in terminal |
| `repairedFilePath` | `string \| null` | `null` | Absolute path to `_recovered.mp4` output |
| `repairSuccess` | `boolean` | `false` | True after REPAIR_SUCCESS |
| `repairError` | `string \| null` | `null` | Error message displayed on REFERENCE step after failure |
| `licenseKey` | `string \| null` | `null` | Validated license key (stored in-memory only, not persisted) |
| `licenseValid` | `boolean` | `false` | True after successful license validation |
| `showExport` | `boolean` | `false` | True after SHOW_EXPORT or LICENSE_VALID (controls ExportPanel render path) |

**Rust counterpart:** None — this is entirely frontend state. Rust commands are stateless.

---

### `TauriRepairResult` (`src/types/index.ts`, lines 19–24)

```typescript
export interface TauriRepairResult {
  success: boolean;
  output_path: string | null;
  log: string[];
  error: string | null;
}
```

This is the TypeScript mirror of the Rust `RepairResult` struct. Field names match the Rust struct's serialized JSON keys exactly (snake_case preserved).

| TS field | Rust field | Type mapping |
|---|---|---|
| `success` | `success: bool` | `bool` → `boolean` |
| `output_path` | `output_path: Option<String>` | `Option<String>` → `string \| null` |
| `log` | `log: Vec<String>` | `Vec<String>` → `string[]` |
| `error` | `error: Option<String>` | `Option<String>` → `string \| null` |

---

### `Action` (`src/hooks/useRepair.ts`, lines 14–26, unexported)

Discriminated union used internally by `useReducer`:

```typescript
type Action =
  | { type: 'SET_BROKEN_FILE'; path: string }
  | { type: 'SET_REFERENCE_FILE'; path: string }
  | { type: 'SKIP_REFERENCE' }
  | { type: 'UNDO_SKIP' }
  | { type: 'START_REPAIR' }
  | { type: 'REPAIR_PROGRESS'; progress: number; log?: string }
  | { type: 'REPAIR_SUCCESS'; outputPath: string; log: string[] }
  | { type: 'REPAIR_FAILED'; error: string; log: string[] }
  | { type: 'SHOW_EXPORT' }
  | { type: 'LICENSE_VALID'; key: string }
  | { type: 'LICENSE_INVALID' }
  | { type: 'RESET' };
```

---

### `ExportStep` (`src/components/ExportPanel.tsx`, line 10, unexported)

Local state type inside `ExportPanel`, not exported from `types/index.ts`:

```typescript
type ExportStep = 'license' | 'ready' | 'saving' | 'done' | 'error';
```

| Value | Description |
|---|---|
| `'license'` | Waiting for user to enter and verify license key |
| `'ready'` | License verified; export button active |
| `'saving'` | `pickSaveLocation` or `saveRepairedFile` in progress |
| `'done'` | File saved successfully |
| `'error'` | Defined in the type but never explicitly set; errors use `setError(msg)` and revert to `'ready'` |

---

## 3. IPC Command Contracts

Tauri 2 automatically converts camelCase JS parameter names to snake_case Rust parameter names.

### `repair_no_reference`

```
JS call:        invoke('repair_no_reference', { brokenPath: string })
Rust parameter: broken_path: String             (camelCase→snake_case auto-converted)
Rust return:    Result<RepairResult, String>
JS return:      Promise<TauriRepairResult>       (resolves on Ok, rejects on Err)
```

**Error surface:** If the Rust function returns `Err(String)`, the JS `invoke()` call rejects. `tauriCommands.ts` catches this and returns a synthetic `TauriRepairResult { success: false, output_path: null, log: [String(err)], error: String(err) }`.

---

### `repair_with_reference`

```
JS call:        invoke('repair_with_reference', { brokenPath: string, referencePath: string })
Rust parameters: broken_path: String, reference_path: String
Rust return:    Result<RepairResult, String>
JS return:      Promise<TauriRepairResult>
```

**Error surface:** Same catch pattern as above.

---

### `validate_license`

```
JS call:        invoke('validate_license', { licenseKey: string })
Rust parameter: license_key: String
Rust return:    Result<bool, String>
JS return:      Promise<boolean>
```

**Error surface:** On `Err`, `tauriCommands.ts` returns `false` (not rethrown).

---

### `open_file_in_player`

```
JS call:        invoke('open_file_in_player', { path: string })
Rust parameter: path: String
Rust return:    Result<(), String>
JS return:      Promise<void>
```

**Error surface:** On `Err`, `tauriCommands.ts` logs to `console.error` and swallows (does not rethrow).

---

### `save_repaired_file`

```
JS call:        invoke('save_repaired_file', { sourcePath: string, destinationPath: string })
Rust parameters: source_path: String, destination_path: String
Rust return:    Result<(), String>
JS return:      Promise<void>
```

**Error surface:** `tauriCommands.ts` **rethrows** on error — this propagates to `exportFile()` in `useRepair.ts`, which also rethrows, allowing `ExportPanel` to catch and display the error message.

---

## 4. State Machine Schema

### Initial state (all fields)

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

### Reducer cases — state diff summary

| Action | Fields changed |
|---|---|
| `SET_BROKEN_FILE` | `step='reference'`, `brokenFilePath=path`, `repairError=null` |
| `SET_REFERENCE_FILE` | `referenceFilePath=path`, `hasReferenceFile=true`, `skippedReference=false`, `repairError=null` |
| `SKIP_REFERENCE` | `referenceFilePath=null`, `hasReferenceFile=false`, `skippedReference=true`, `repairError=null` |
| `UNDO_SKIP` | `skippedReference=false`, `repairError=null` |
| `START_REPAIR` | `step='repairing'`, `repairProgress=0`, `repairLog=[]`, `repairError=null`, `repairSuccess=false` |
| `REPAIR_PROGRESS` | `repairProgress=progress`, `repairLog=[...prev, log]` (log appended only if `action.log` is defined) |
| `REPAIR_SUCCESS` | `step='preview'`, `repairSuccess=true`, `repairedFilePath=outputPath`, `repairLog=[...prev, ...action.log]`, `repairProgress=100`, `repairError=null` |
| `REPAIR_FAILED` | `step='reference'`, `repairSuccess=false`, `repairLog=[...prev, ...action.log]`, `repairProgress=0`, `repairError=action.error` |
| `SHOW_EXPORT` | `step='export'`, `showExport=true` |
| `LICENSE_VALID` | `licenseKey=key`, `licenseValid=true`, `step='export'`, `showExport=true` |
| `LICENSE_INVALID` | `licenseValid=false` |
| `RESET` | All fields reset to `initialState` |

---

## 5. Environment Variables

| Variable | Required? | Default | Set by | Description |
|---|---|---|---|---|
| `LEMON_SQUEEZY_API_KEY` | Production only | `""` (empty string) | CI/CD build env or `.env` (via build.rs) | Lemon Squeezy API key for license validation. When empty, `TEST-` prefix keys validate as true. |

**How the key is passed:**

`build.rs`:
```rust
if let Ok(key) = std::env::var("LEMON_SQUEEZY_API_KEY") {
    println!("cargo:rustc-env=LEMON_SQUEEZY_API_KEY={}", key);
}
```

`main.rs` at runtime:
```rust
let api_key = std::env::var("LEMON_SQUEEZY_API_KEY").unwrap_or_else(|_| "".to_string());
```

⚠️ ASSUMPTION: `cargo:rustc-env` causes the variable to be available via `env!()` macro at compile time, but `std::env::var()` reads the *process* environment at runtime. In practice, the key embedded via `cargo:rustc-env` is **not** accessible via `std::env::var()` in the running binary — only via the `env!()` macro. The current code uses `std::env::var()`, which means it reads the runtime process environment. This is likely unintentional and should be changed to use `env!("LEMON_SQUEEZY_API_KEY", "")` for compile-time embedding, or documented as requiring an environment variable set in the deployment.

**.env.example:**
```
LEMON_SQUEEZY_API_KEY=your_lemon_squeezy_api_key_here
```

---

## 6. File System Interactions

| Operation | Who | Path | When |
|---|---|---|---|
| Read: broken file (metadata) | Rust (`std::fs::metadata`) | User-selected path | Validation before FFmpeg |
| Read: broken file (stream) | FFmpeg subprocess | User-selected path | During `repair_no_reference` and `repair_with_reference` |
| Read: reference file (stream) | FFmpeg subprocess | User-selected path | During `repair_with_reference` Strategy 2+3 |
| Write: recovered file | FFmpeg subprocess | `{broken_dir}/{stem}_recovered.mp4` | During all repair commands |
| Write: exported file | Rust (`std::fs::copy`) | User-chosen path (save dialog) | `save_repaired_file` |

**Key invariant:** The app itself never reads the video data — only FFmpeg does. Rust only reads file metadata (size check) and calls `std::fs::copy` for the export. The broken and reference files are passed as string paths to FFmpeg as command-line arguments.

**Output path logic (`recovered_output_path`):**
```
Input:  /Users/streamer/Videos/stream_2024-01-15.mp4
Output: /Users/streamer/Videos/stream_2024-01-15_recovered.mp4
```
The recovered file is always written adjacent to the broken file, regardless of where the user's OBS recordings folder is.

---

## 7. External API Contracts

### Lemon Squeezy License Validation

```
Endpoint:     POST https://api.lemonsqueezy.com/v1/licenses/validate
Headers:
  Authorization:  Bearer {LEMON_SQUEEZY_API_KEY}
  Accept:         application/json
  Content-Type:   application/json

Request body:
{
  "license_key": "<user-entered key>",
  "instance_name": "StreamSalvage-Desktop"
}

Response (success):
{
  "valid": true,
  ... (other Lemon Squeezy fields, ignored)
}

Response (invalid key):
{
  "valid": false,
  ...
}
```

**Parsing logic:**
```rust
let json: serde_json::Value = response.json().await...;
Ok(json["valid"].as_bool().unwrap_or(false))
```
Only `json["valid"]` is read. All other response fields are ignored. If `valid` is missing, null, or not a bool, defaults to `false`.

**Error handling matrix:**

| Condition | Rust return | JS outcome | User sees |
|---|---|---|---|
| `LEMON_SQUEEZY_API_KEY` empty | `Ok(key.starts_with("TEST-"))` | `true` or `false` | Validation passes for TEST- keys |
| Network error | `Err("Network error during validation: {e}")` | Promise rejects | "Could not verify license - check your internet connection" |
| HTTP non-2xx | `Ok(false)` | `false` | "License key not recognized..." |
| `valid: true` in JSON | `Ok(true)` | `true` | License verified, export unlocked |
| `valid: false` in JSON | `Ok(false)` | `false` | "License key not recognized..." |
| JSON parse error | `Err("Parse error: {e}")` | Promise rejects | "Could not verify license..." |

**Checkout URL** (hardcoded in `ExportPanel.tsx`, line 98):
```
https://streamsalvage.lemonsqueezy.com/buy/
```
This is the live Lemon Squeezy store link for purchasing StreamSalvage.
