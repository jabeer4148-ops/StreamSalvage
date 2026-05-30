# StreamSalvage — Application Flow Document

---

## 1. Complete User Journey Map

### Happy path (with reference file)

```
 1. User launches StreamSalvage.exe
    └── App renders at 780×620, centered
    └── Step: BROKEN — "Select your corrupted recording"

 2. User clicks DropZone or the "Select a file first" button
    └── pickBrokenFile() → native OS file picker
        Filters: .mp4, .mov, .m4v
        Title: "Select your corrupted recording"
        └─ [Cancel] → picker closes, app stays on BROKEN step, nothing changes
        └─ [Select] → path string returned

 3. File selected
    └── dispatch(SET_BROKEN_FILE) → step advances to REFERENCE
    └── Button changes to "File selected - continuing" (green, disabled)
    └── DropZone shows filename (truncated to 40ch) + "Click to change"
    └── "Start over" link appears in header

 4. Step: REFERENCE — "Add a short healthy recording"
    └── Selected broken filename shown in grey info bar
    └── ReferenceExplainer always visible (blue info box):
        - Explains MOOV atom concept
        - 4-step guide to create reference in OBS (10 seconds)
    └── Reference DropZone shown (blue dashed border)

 5. User records 10-second OBS clip, then selects it via DropZone
    └── pickReferenceFile() → native OS file picker
        Filters: .mp4, .mov, .m4v
        Title: "Select a healthy reference recording (same OBS settings)"
        └─ [Cancel] → picker closes, stays on REFERENCE, nothing changes
        └─ [Select] → path returned

 6. Reference file selected
    └── dispatch(SET_REFERENCE_FILE) → hasReferenceFile = true
    └── "Start Repair" button becomes active (green)
    └── canStartRepair = true (referenceFilePath !== null)

 7. User clicks "Start Repair"
    └── dispatch(START_REPAIR) → step = REPAIRING
    └── repairRunId incremented (race condition guard)
    └── Progress timer starts: +3% every 100ms, capped at 90%
    └── 4 log messages emitted at thresholds: 3%, 30%, 60%, 90%
    └── repairWithReference(brokenPath, referencePath) invoked

 8. Step: REPAIRING — "Repairing your recording"
    └── Progress bar animates 0% → 90% over ~30s
    └── Log terminal shows green text on dark background
    └── No user interaction possible (no cancel button)
    └── If 60 seconds elapse: "Still working... Large files can take a few minutes."

 9. FFmpeg completes (repair_with_reference Rust command):
    └── Strategy 1 (stream copy) → if output valid: success
    └── Strategy 2 (reference remap) → if output valid: success
    └── Strategy 3 (fallback +genpts) → if output valid: success
    └── dispatch(REPAIR_SUCCESS, outputPath, log)
        → step = PREVIEW, repairProgress = 100

10. Step: PREVIEW — "Repair successful"
    └── Green success banner: "Your recording has been recovered. Preview the first 30 seconds below for free..."
    └── Dark preview block with "Play" button
    └── Filename shown (truncated): "Saved to: {filename}"
    └── CTA button: "Unlock full video — $29 one-time →"

11. User clicks "Play"
    └── openFileInPlayer(repairedFilePath)
        → cmd /c start "" <path>
        → System default media player opens the file
        → App remains on PREVIEW screen

12. User clicks "Unlock full video — $29 one-time →"
    └── dispatch(SHOW_EXPORT) → step = EXPORT

13. Step: EXPORT — License input screen
    └── Amber box: "Enter the license key from your purchase email"
    └── Checkout link: https://streamsalvage.lemonsqueezy.com/buy/
    └── License key input field (monospace, auto-uppercase)
    └── "Verify license key" button (disabled until input non-empty)
    └── Trust line: "Key is verified locally - never stored on our servers"

14. User purchases at Lemon Squeezy → receives key by email
    └── Types/pastes key into input field
    └── Clicks "Verify license key" (or presses Enter)
    └── handleCheckLicense() → setChecking(true)
        → validateLicense(key) → invoke('validate_license', { licenseKey })
        → Rust: POST https://api.lemonsqueezy.com/v1/licenses/validate
        └─ [Valid] → dispatch(LICENSE_VALID) → exportStep = 'ready'
        └─ [Invalid] → setError("License key not recognized...") → stays on license step

15. exportStep = 'ready'
    └── Green banner: "License verified - ready to export"
    └── Info: "Click below to choose where to save your repaired video..."
    └── "Save repaired video to disk" button (active)

16. User clicks "Save repaired video to disk"
    └── setExportStep('saving') → button shows "Saving..."
    └── pickSaveLocation('repaired_recording.mp4')
        → native OS save dialog
        └─ [Cancel] → setExportStep('ready') → back to ready state
        └─ [Choose] → destinationPath returned
    └── saveRepairedFile(repairedFilePath, destinationPath)
        → Rust: std::fs::copy(source, destination)
    └── setExportStep('done')

17. exportStep = 'done'
    └── 🎉 "File saved successfully"
    └── "Your recovered recording is ready to use."
    └── "Repair another file" link → dispatch(RESET) → step = BROKEN
```

---

## 2. State Transition Diagram

```
                    ┌──────────────────────────────────────────┐
                    │  RESET (from any step via "Start over")  │
                    └──────────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
  ──── launch ────► │     BROKEN      │
                    │ select file     │
                    └────────┬────────┘
                             │ SET_BROKEN_FILE (file selected)
                             │
                             ▼
                    ┌─────────────────┐◄──────────────────────────────┐
              ┌────►│   REFERENCE     │  REPAIR_FAILED                │
              │     │                 │  (returns here, shows error)  │
              │     │ ┌─────────────┐ │◄──────────────────────────────┘
              │     │ │with ref file│ │
              │     │ └─────────────┘ │
              │     │ ┌─────────────┐ │
              │     │ │ skipped ref │ │
              │     │ └─────────────┘ │
              │     └────────┬────────┘
              │              │ START_REPAIR
              │              │ (canStartRepair = referenceFilePath !== null
              │              │                  OR skippedReference === true)
              │              ▼
              │     ┌─────────────────┐
              │     │   REPAIRING     │
              │     │                 │
              │     │ 0% ──► 90%      │─── REPAIR_FAILED ──►──────────┘
              │     │ (simulated)     │
              │     └────────┬────────┘
              │              │ REPAIR_SUCCESS (→ 100%)
              │              ▼
              │     ┌─────────────────┐
              │     │    PREVIEW      │
              │     │                 │
              │     │ [Play]          │──── opens system player (no state change)
              │     │ [Unlock →]      │
              │     └────────┬────────┘
              │              │ SHOW_EXPORT
              │              ▼
              │     ┌─────────────────┐
              │     │     EXPORT      │
              │     │                 │
              │     │ exportStep:     │
              │     │  'license'      │◄── LICENSE_INVALID (stays here)
              │     │      ↓          │
              │     │  'ready'        │◄── LICENSE_VALID
              │     │      ↓          │
              │     │  'saving'       │
              │     │      ↓          │
              │     │  'done'         │
              │     └────────┬────────┘
              │              │ "Repair another file" → RESET
              └──────────────┘
```

---

## 3. Each Screen Specification

### Screen 1: BROKEN — "Select your corrupted recording"

**Components rendered:** `StepTabs` (all future steps greyed), `DropZone` (variant: broken)

| Element | State | Condition |
|---|---|---|
| DropZone | Empty (red dashed border, "Drop your corrupted recording here") | `brokenFilePath === null` |
| DropZone | Filled (solid neutral border, filename shown) | `brokenFilePath !== null` |
| "Select a file first" button | Grey, `cursor-not-allowed` | `brokenFilePath === null` |
| "File selected - continuing" button | Green (`#1D9E75`), `cursor-default`, disabled | `brokenFilePath !== null` |
| "Start over" link | Hidden | Always on BROKEN step |

**User actions:** Click DropZone or button → file picker opens

**Transition:** File selected → SET_BROKEN_FILE → REFERENCE step

---

### Screen 2: REFERENCE — "Add a short healthy recording"

**Components rendered:** `StepTabs` (step 1 marked Done), broken file info bar, `ReferenceExplainer`, `DropZone` (variant: reference), `NoReferenceWarning`, error banner (conditional), "Start Repair" button

| Element | State | Condition |
|---|---|---|
| Broken file info bar | Shows filename (grey, truncated) | Always shown when `brokenFileName` is set |
| ReferenceExplainer | Blue info box, always visible | Always |
| Reference DropZone | Empty (blue dashed border) | `referenceFilePath === null` |
| Reference DropZone | Filled (filename) | `referenceFilePath !== null` |
| NoReferenceWarning | "I don't have a reference file" toggle | Always shown |
| NoReferenceWarning | Expanded amber panel | `skipped === true` |
| Error banner | Red box with `repairError` text | `state.repairError !== null` (on return from failed repair) |
| "Start Repair" button | Green, enabled | `referenceFilePath !== null \|\| skippedReference === true` |
| "Start Repair" button | Grey, `cursor-not-allowed` | Neither condition met |
| "Start over" link | Visible in header | Always on non-BROKEN steps |

**User actions:**
- Click reference DropZone → `pickReferenceFile()` dialog
- Click NoReferenceWarning → toggle `SKIP_REFERENCE` / `UNDO_SKIP`
- Click "Start Repair" (if enabled) → `startRepair()` → REPAIRING

---

### Screen 3: REPAIRING — "Repairing your recording"

**Components rendered:** `StepTabs` (steps 1–2 Done), `RepairProgress`

| Element | State | Condition |
|---|---|---|
| Progress bar | Animates 0→90% at 3%/100ms | While FFmpeg runs |
| Progress bar | Snaps to 100% | On REPAIR_SUCCESS |
| Percentage label | Green (`#1D9E75`), updates live | Always |
| Long-wait message | "Still working..." info box | After 60s without completion |
| Amber warning | "Running without reference file..." | `hasReferenceFile === false` |
| Error panel | Red box with error text | `repairError !== null` |
| Log terminal | Dark bg, green monospace text | Always; empty shows "Starting repair engine..." |

**User actions:** None (no interactive elements during repair)

---

### Screen 4: PREVIEW — "Repair successful"

**Components rendered:** `StepTabs` (steps 1–3 Done), `VideoPreview`

| Element | State | Condition |
|---|---|---|
| Green success banner | "Repair successful" + description | Always (repair must have succeeded to reach here) |
| Preview block header | "Free preview — first 30 seconds" + "🔒 Full video locked" badge | Always |
| Dark preview area | "Play / Open in media player" button | Always |
| Filename label | "Saved to: {filename}" | Always; shows `_recovered.mp4` filename |
| "Unlock full video — $29 one-time →" | Primary CTA, green | Always |
| "No subscription · instant license key via email" | Trust copy below CTA | Always |
| Error fallback | "Repair completed but output file path is missing. Please restart and try again." | `repairedFilePath === null` |

**User actions:**
- Click "Play" → `openFileInPlayer()` → system media player opens
- Click "Unlock full video →" → `showExport()` → EXPORT step

---

### Screen 5: EXPORT — License & Save

**Components rendered:** `StepTabs` (steps 1–4 Done), `ExportPanel`

ExportPanel has its own local state machine (`ExportStep`):

**`exportStep = 'license'`** (default when `licenseValid === false`)

| Element | Behavior |
|---|---|
| Amber unlock box | "Enter the license key from your purchase email" + checkout link |
| Checkout link | `https://streamsalvage.lemonsqueezy.com/buy/` opens in browser |
| License key input | Monospace font, auto-uppercase on change, Enter key submits |
| "Verify license key" button | Disabled when input empty or `checking === true`; shows "Verifying..." during check |
| Error text | Shows on invalid key; replaced by trust text when no error |
| Dev hint | "Dev mode: use TEST-XXXX to bypass validation" (DEV builds only) |

**`exportStep = 'ready'`** (after successful license validation)

| Element | Behavior |
|---|---|
| Green "License verified" banner | Confirmation |
| Info box | Explains save dialog behavior |
| "Save repaired video to disk" button | Active, green; opens native save dialog |
| "Save to any folder - keeps original untouched" | Trust copy |

**`exportStep = 'saving'`** (while `pickSaveLocation` + `saveRepairedFile` run)

| Element | Behavior |
|---|---|
| "Saving..." button | Disabled, grey |

**`exportStep = 'done'`** (after successful copy)

| Element | Behavior |
|---|---|
| 🎉 "File saved successfully" | Success state |
| "Repair another file" link | Triggers `onReset()` → dispatch(RESET) |

---

## 4. Error States

| Error | Trigger | Message Shown | Recovery Action |
|---|---|---|---|
| File under 1 MB | `repair_no_reference` or `repair_with_reference` validates `metadata.len() < 1_048_576` | "File too small to be a valid recording (under 1MB). Are you sure this is the right file?" | REPAIR_FAILED → returns to REFERENCE; user can reselect broken file |
| Same file error | `repair_with_reference` checks `broken_path == reference_path` | "Broken file and reference file cannot be the same file." | REPAIR_FAILED → returns to REFERENCE |
| FFmpeg not found | `get_ffmpeg_path()` exhausts all 4 search strategies | "FFmpeg binary not found. Tried multiple locations. Please ensure src-tauri/binaries/ffmpeg-x86_64-pc-windows-msvc.exe exists and Git LFS files are pulled (run: git lfs pull)" | Result::Err → JS catches, REPAIR_FAILED → REFERENCE |
| Repair failed (FFmpeg) | All strategies produce output < 1,024 bytes or non-zero exit | "FFmpeg stream copy could not recover this file." (no-ref) or "Could not reconstruct file. The recording may be too severely corrupted." (with-ref) | REPAIR_FAILED → REFERENCE; error shown in red banner; user can try with reference or try again |
| License key not recognized | Lemon Squeezy returns `valid: false` or HTTP non-2xx | "License key not recognized. Check your purchase email from Lemon Squeezy. Keys look like: XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX" | Stays on license exportStep; user re-enters key |
| Network error on validation | `reqwest` network error | "Could not verify license - check your internet connection and try again." | Stays on license exportStep; user retries |
| Export failed / cancelled | `saveRepairedFile` throws or save dialog cancelled | "Export failed - the save dialog may have been cancelled, or the destination folder may not be writable. Try again." | setExportStep('ready') → user tries save again |
| Preview file path missing | `repairedFilePath === null` on PREVIEW render | "Repair completed but output file path is missing. Please restart and try again." | Manual restart required |

---

## 5. Edge Cases Handled

| Edge Case | Handling |
|---|---|
| Cancel file picker (broken) | `pickBrokenFile()` returns `null`; `if (path)` guard prevents dispatch; app stays on BROKEN |
| Cancel file picker (reference) | `pickReferenceFile()` returns `null`; same guard; app stays on REFERENCE |
| Cancel save dialog | `pickSaveLocation()` returns `null`; `if (dest)` guard in `exportFile()`; export silently skipped; `setExportStep('ready')` remains on error catch |
| Stale repair from cancelled/reset | `repairRunIdRef` counter check: callbacks with mismatched ID are discarded silently |
| "Start over" during repair | `reset()` increments `repairRunIdRef` and clears progress timer; FFmpeg process continues in background but its result is discarded |
| Long file names | CSS `truncate max-w-[40ch] mx-auto` in DropZone; `title` attribute preserves full path on hover; `truncate` class in VideoPreview filename |
| Long repair time (> 60s) | `RepairProgress` sets `showLongWaitMessage` after 60,000ms timeout; message: "Still working... Large files can take a few minutes." |
| Dialog open/save errors | `tauriCommands.ts` wraps all `invoke` and `open`/`save` calls in try/catch; `console.error` logged; `null` returned |
| Empty license key field | "Verify license key" button is `disabled` when `!key.trim()`; keyboard Enter handler also checks |
| `repairedFilePath === null` on PREVIEW | VideoPreview renders error fallback: "Repair completed but output file path is missing. Please restart and try again." |
| Reference file not found at repair time | Rust checks `Path::new(&reference_path).exists()` before proceeding; early `REPAIR_FAILED` |
| Broken file deleted between selection and repair | Rust checks `Path::new(&broken_path).exists()`; early `REPAIR_FAILED` with "File not found" |
| Progress timer leak on unmount | `useEffect(() => stopProgressTimer, [stopProgressTimer])` — cleanup function runs on component unmount |
