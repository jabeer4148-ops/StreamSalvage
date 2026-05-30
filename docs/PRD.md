# StreamSalvage — Product Requirements Document
Version: 1.0.0 | Status: Release Candidate

---

## 1. Executive Summary

StreamSalvage (marketed as "RecoverRec" on the landing page) is a Windows desktop application that recovers corrupted MP4 recordings produced by OBS and other screen recorders when the recording session terminates abnormally. It runs entirely on the user's machine — no file upload, no cloud, no command line — and uses a bundled FFmpeg binary to attempt stream recovery through up to three escalating repair strategies. Users can preview the first 30 seconds of the repaired file at no cost, then pay $29 (one-time, no subscription) to export the full recovered video.

**Problem it solves** (derived from `ReferenceExplainer.tsx` and `landing/index.html`): When OBS crashes, the recording process is interrupted before FFmpeg or OBS can write the MOOV atom — the block of "playback instructions" at the end of an MP4 file that tells media players how to decode the stream. Without this block, the file appears corrupt and refuses to open in VLC, Windows Media Player, or any standard editor. StreamSalvage reconstructs or substitutes this metadata using FFmpeg stream-copy and reference-guided re-mapping.

**Target user persona** (derived from landing page copy and UI language): Streamers and content creators on Windows who record with OBS, have experienced at least one crash-corrupted recording, are not comfortable with command-line tools, and are willing to pay a small one-time fee to recover footage that represents hours of work. The landing page explicitly targets users who have already tried VLC and rejected cloud tools as "sketchy."

**Business model** (derived from `ExportPanel.tsx` and Lemon Squeezy checkout URL): One-time purchase of $29 via Lemon Squeezy. The checkout URL is `https://streamsalvage.lemonsqueezy.com/buy/`. After purchase, users receive a license key by email and enter it in the app to unlock file export. The repair and preview features are free; only the export (save to disk) is gated.

---

## 2. Problem Statement

### Primary pain point: OBS crash = lost MOOV atom
MP4 files written by OBS use a file format that requires a metadata block (the MOOV atom) at the end of the file. This block is written only when the recording is stopped cleanly. If OBS crashes, the power fails, or the process is force-killed, the MOOV atom is never written. The resulting file contains all the encoded video and audio data but lacks the index that media players need to navigate it. Standard players report the file as invalid or corrupt.

### Current solutions and why they fail (from `landing/index.html`)
| Tool | Failure Mode |
|---|---|
| VLC | Can play through some damage but cannot rebuild missing MOOV atom metadata |
| Wondershare / similar | Requires upload of private footage; bundled with adware/installers |
| FFmpeg (manual) | Requires command-line knowledge; no UI; users don't know the correct flags |
| Online tools | Privacy risk for private or copyrighted stream footage |

### The gap StreamSalvage fills
A GUI wrapper around proven FFmpeg recovery strategies, delivered as a signed Windows installer, that verifies the repair works before the user pays. No upload, no subscription, no command line.

---

## 3. Product Goals

| Goal | Metric |
|---|---|
| Primary: recover corrupted MP4 recordings locally | ~40% success without reference file; ~85% with reference file |
| Secondary: one-time $29 purchase, no subscription | Zero recurring billing; export gated on license key |
| Trust: local-only processing | Zero file uploads; no telemetry; license validation is the only outbound network call |
| Low barrier: no technical skill required | Zero command-line interaction; drag-and-drop file selection |

---

## 4. User Stories

| ID | Story |
|---|---|
| US-001 | As a streamer, I want to select my corrupted .mp4 file using a file picker so that I don't have to type paths manually. |
| US-002 | As a user, I want to understand what a reference file is and how to create one in 10 seconds so that I can maximize my chances of recovery. |
| US-003 | As a user who doesn't have a reference file, I want to skip that step and attempt recovery anyway so that I have some chance of getting my footage back immediately. |
| US-004 | As a user, I want to see a progress bar and live log output during repair so that I know the app is working and not frozen. |
| US-005 | As a user, I want to preview the repaired video in my system media player before paying so that I only pay when the repair actually works. |
| US-006 | As a user who has purchased a license, I want to enter my license key and have it verified instantly so that I can proceed to export without waiting. |
| US-007 | As a licensed user, I want to save the repaired video to a folder I choose using a save dialog so that the file goes exactly where I want it. |
| US-008 | As a user who repaired one file, I want to repair another file without restarting the app so that I can process multiple recordings in one session. |

---

## 5. Functional Requirements

**File Input**

| ID | Requirement |
|---|---|
| FR-001 | App shall accept `.mp4`, `.mov`, and `.m4v` files as broken input (dialog filter in `pickBrokenFile`). |
| FR-002 | App shall accept `.mp4`, `.mov`, and `.m4v` files as reference input (dialog filter in `pickReferenceFile`). |
| FR-003 | App shall reject input files under 1,048,576 bytes (1 MB) with the message: "File too small to be a valid recording (under 1MB). Are you sure this is the right file?" |
| FR-004 | App shall reject a reference file that is the same path as the broken file with the message: "Broken file and reference file cannot be the same file." |
| FR-005 | App shall display the filename (not full path) of selected files, truncated with CSS `truncate max-w-[40ch]`. |

**Repair — No Reference**

| ID | Requirement |
|---|---|
| FR-006 | App shall attempt recovery using FFmpeg stream copy (`-c copy -avoid_negative_ts make_zero`) when no reference file is provided. |
| FR-007 | App shall report an expected success rate of ~40% when operating without a reference file. |
| FR-008 | App shall write the output file next to the broken file with the suffix `_recovered.mp4`. |
| FR-009 | App shall consider a repair successful only if the output file exists and is larger than 1,024 bytes. |

**Repair — With Reference**

| ID | Requirement |
|---|---|
| FR-010 | App shall attempt three escalating repair strategies when a reference file is provided. |
| FR-011 | Strategy 1: FFmpeg stream copy with `+faststart` movflag. |
| FR-012 | Strategy 2 (if Strategy 1 fails): FFmpeg re-map using reference as container (`-i reference -i broken -map 1:v? -map 1:a? -c copy -avoid_negative_ts make_zero -movflags +faststart`). |
| FR-013 | Strategy 3 (if Strategy 2 fails): FFmpeg fallback with `-fflags +genpts -err_detect ignore_err` to regenerate timestamps and ignore decode errors. |
| FR-014 | App shall report an expected success rate of ~85% when operating with a reference file. |
| FR-015 | App shall return early with a success result if any strategy produces a valid output file (>1,024 bytes), without attempting remaining strategies. |

**Progress & Feedback**

| ID | Requirement |
|---|---|
| FR-016 | App shall display a simulated progress bar that advances 3% every 100ms, capped at 90%, until the FFmpeg process completes. |
| FR-017 | App shall emit four contextual log messages at progress thresholds: 3% ("Launching FFmpeg repair process..."), 30% ("Reading damaged MP4 container..."), 60% (context-sensitive), 90% ("Waiting for FFmpeg to finish..."). |
| FR-018 | App shall display all FFmpeg stderr output as scrollable terminal log (green monospace text on dark background). |
| FR-019 | App shall display the message "Still working... Large files can take a few minutes." if progress has been running for more than 60 seconds without completing. |
| FR-020 | App shall display an amber warning during repair if no reference file was provided. |

**Preview**

| ID | Requirement |
|---|---|
| FR-021 | App shall advance to the preview screen on repair success. |
| FR-022 | App shall open the repaired file in the system default media player when the user clicks "Play". |
| FR-023 | App shall display the repaired filename on the preview screen. |
| FR-024 | App shall show the message "Free preview — first 30 seconds" to set user expectations (UI copy — the app itself does not enforce a time limit; the player does). |
| FR-025 | App shall display "Unlock full video — $29 one-time →" as the primary CTA on the preview screen. |

**Export & License**

| ID | Requirement |
|---|---|
| FR-026 | App shall require a valid Lemon Squeezy license key before enabling file export. |
| FR-027 | App shall auto-uppercase characters as the user types in the license key input field. |
| FR-028 | App shall allow license validation to be triggered by pressing Enter in the license key field. |
| FR-029 | App shall validate the license key against the Lemon Squeezy API endpoint `POST https://api.lemonsqueezy.com/v1/licenses/validate`. |
| FR-030 | App shall display the error: "License key not recognized. Check your purchase email from Lemon Squeezy. Keys look like: XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX" on invalid key. |
| FR-031 | App shall display a "Save repaired video to disk" button after successful license validation. |
| FR-032 | App shall open a native save dialog with default filename `repaired_recording.mp4` filtered to `.mp4` only. |
| FR-033 | App shall copy the repaired file to the user-chosen destination using `std::fs::copy`. |
| FR-034 | App shall display "File saved successfully" and a "Repair another file" link after successful export. |
| FR-035 | App shall display a checkout link to `https://streamsalvage.lemonsqueezy.com/buy/` for users who don't have a license. |

**Navigation**

| ID | Requirement |
|---|---|
| FR-036 | App shall display a 5-tab step indicator (`Broken file` / `Reference file` / `Repairing` / `Preview` / `Export`) showing completed and current steps. |
| FR-037 | App shall display a "Start over" link visible on all screens except the initial `broken` step. |
| FR-038 | App shall return to the `reference` step on repair failure, preserving the broken file selection and displaying the error message. |
| FR-039 | App shall clear all state and return to the `broken` step when "Start over" or "Repair another file" is clicked. |

**Dev Mode**

| ID | Requirement |
|---|---|
| FR-040 | In development builds (`import.meta.env.DEV`), app shall display a hint: "Dev mode: use TEST-XXXX to bypass validation." |
| FR-041 | When `LEMON_SQUEEZY_API_KEY` env var is empty at runtime, any license key beginning with `TEST-` shall validate as true. |

---

## 6. Non-Functional Requirements

| ID | Requirement |
|---|---|
| NFR-001 | App window shall be fixed at 780×620 pixels, non-resizable, and centered on screen (from `tauri.conf.json`). |
| NFR-002 | All file reading and writing shall occur on the user's local machine; no file data shall be transmitted over the network. |
| NFR-003 | App shall function fully offline except for license key validation. |
| NFR-004 | License validation network call shall be non-blocking (async/await via tokio + reqwest); UI shall not freeze during validation. |
| NFR-005 | FFmpeg binary shall be bundled with the installer; the user shall not be required to install FFmpeg separately. |
| NFR-006 | App shall not crash or freeze if the user cancels a file picker dialog (all dialog calls return `null` on cancel and are handled). |
| NFR-007 | App shall guard against stale-repair race conditions using a `repairRunIdRef` counter; only the most recently initiated repair may update state. |
| NFR-008 | App shall use the system UI font stack (`system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`) for native desktop feel. |
| NFR-009 | All interactive elements shall have visible focus rings for keyboard accessibility. |
| NFR-010 | App shall not store any user data, file paths, or license keys to disk; all state is in-memory and reset on restart. |

---

## 7. Out of Scope (v1.0)

- macOS support (binary is `ffmpeg-x86_64-pc-windows-msvc.exe`; `open_file_in_player` uses `cmd /c start` — Windows-only)
- Linux support
- Subscription or seat-based license model
- Cloud storage integration or file upload
- Batch repair of multiple files
- In-app video preview with embedded player (preview opens system default media player)
- Auto-update mechanism
- Crash reporting or telemetry
- MKV, AVI, or other container formats beyond mp4/mov/m4v

---

## 8. Success Metrics

| Metric | Target |
|---|---|
| Repair success rate (with reference) | ~85% |
| Repair success rate (no reference) | ~40% |
| Time to first repair attempt (from app open) | Under 2 minutes |
| License conversion rate from preview | 20%+ |
| Refund rate | Under 5% |
| SmartScreen warning clears naturally | After ~500 downloads (Microsoft reputation threshold) |

---

## 9. Constraints

**Window & platform (from `tauri.conf.json`):**
- Fixed 780×620 window, non-resizable, centered
- Windows-only distribution (x86_64-pc-windows-msvc FFmpeg binary)
- App identifier: `com.streamsalvage.app`

**Rust dependencies (from `Cargo.toml`):**
- `tauri 2`, `tauri-plugin-dialog 2`, `tauri-plugin-shell 2` — Tauri runtime
- `reqwest 0.11` with `json` feature — HTTP client for license validation
- `tokio 1` with `full` features — async runtime
- `serde 1`, `serde_json 1` — JSON serialization
- ⚠️ ASSUMPTION: `uuid 1` and `tauri-plugin-opener 2` are in Cargo.toml but not used in `main.rs`; they may be unused dependencies or reserved for future use.

**Permissions (from `capabilities/default.json`):**
- `core:default` — core Tauri APIs
- `core:path:allow-resolve` — path resolution for FFmpeg binary
- `shell:allow-execute` — spawn FFmpeg subprocess
- `shell:allow-open` — open files in system applications
- `dialog:allow-open` — file open dialogs
- `dialog:allow-save` — file save dialogs
- `opener:default` — open URLs and files

**FFmpeg constraint:** The bundled binary (`binaries/ffmpeg-x86_64-pc-windows-msvc.exe`) must be present for repair to function. Binary is tracked via Git LFS; the error message explicitly instructs: "run: git lfs pull".

⚠️ ASSUMPTION: Exact installer size is not determinable from source alone; FFmpeg static binaries for Windows are typically 60–120 MB, which dominates the installer size.
