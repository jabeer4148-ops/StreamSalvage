# StreamSalvage — Implementation Plan & Release Checklist

---

## 1. What Is Built (v1.0.0)

### Rust commands (`src-tauri/src/main.rs`)
| Command | Status |
|---|---|
| `repair_no_reference` | ✅ Complete — validates input, resolves FFmpeg, runs stream copy, validates output |
| `repair_with_reference` | ✅ Complete — 3-strategy escalating repair (stream copy → reference remap → fallback +genpts) |
| `validate_license` | ✅ Complete — Lemon Squeezy API + dev bypass; async + error handling |
| `open_file_in_player` | ✅ Complete — Windows-only `cmd /c start ""` |
| `save_repaired_file` | ✅ Complete — `std::fs::copy` with error propagation |

### React components (`src/components/`)
| Component | Status |
|---|---|
| `App.tsx` | ✅ Complete — step router, header with "Start over", all handlers wired |
| `StepTabs.tsx` | ✅ Complete — 5-step indicator, done/active/future states |
| `DropZone.tsx` | ✅ Complete — broken + reference variants, empty/filled states, focus ring |
| `ReferenceExplainer.tsx` | ✅ Complete — MOOV atom explanation + 4-step OBS guide |
| `NoReferenceWarning.tsx` | ✅ Complete — skip toggle with amber expansion |
| `RepairProgress.tsx` | ✅ Complete — progress bar, log terminal, long-wait message, no-ref warning |
| `VideoPreview.tsx` | ✅ Complete — success banner, preview block, unlock CTA |
| `ExportPanel.tsx` | ✅ Complete — license input, key validation, save flow, done state |

### Custom hooks
| Hook | Status |
|---|---|
| `useRepair` (`src/hooks/useRepair.ts`) | ✅ Complete — full useReducer state machine, all actions, race condition guard |

### TypeScript utilities
| File | Status |
|---|---|
| `src/lib/tauriCommands.ts` | ✅ Complete — typed wrappers for all 5 commands + 3 dialog calls |
| `src/types/index.ts` | ✅ Complete — `AppStep`, `RepairState`, `TauriRepairResult` |

### Config & infrastructure
| File | Status |
|---|---|
| `src-tauri/tauri.conf.json` | ✅ Complete — window, bundle, icons, external binary |
| `src-tauri/capabilities/default.json` | ✅ Complete — all required permissions |
| `src-tauri/build.rs` | ✅ Complete — reads `LEMON_SQUEEZY_API_KEY` and passes to build |
| `src-tauri/Cargo.toml` | ✅ Complete (with 2 unused deps — see §2) |
| `package.json` | ✅ Complete |
| `.env.example` | ✅ Complete |

### Landing page
| File | Status |
|---|---|
| `landing/index.html` | ✅ Complete — hero, problem grid, how-it-works steps, comparison table, FAQ, footer |

---

## 2. What Remains Before Launch

Findings from searching the codebase for placeholders, dev artifacts, and hardcoded values:

### 🔴 Critical — must fix before launch

**1. Branding inconsistency: landing page is "RecoverRec", app is "StreamSalvage"**
- `landing/index.html:6` — `<title>RecoverRec — Fix Corrupted OBS MP4 Recordings</title>`
- `landing/index.html:337` — `<p class="eyebrow">RecoverRec for Windows</p>`
- `landing/index.html:9,401,434,438,442,446,459,465` — "RecoverRec" used throughout
- `src-tauri/tauri.conf.json` — `"productName": "StreamSalvage"`
- **Action:** Decide on one brand name. Either update the landing page to "StreamSalvage" or the Tauri config to "RecoverRec" everywhere. Currently the app calls itself "StreamSalvage" but the landing page, support email, and footer say "RecoverRec".

**2. `LEMON_SQUEEZY_API_KEY` runtime vs. compile-time embedding bug**
- `src-tauri/build.rs:3` — `println!("cargo:rustc-env=LEMON_SQUEEZY_API_KEY={}", key);`
- `src-tauri/src/main.rs:356` — `std::env::var("LEMON_SQUEEZY_API_KEY").unwrap_or_else(|_| "".to_string())`
- `cargo:rustc-env` makes the var available at compile time via `env!()`, **not** at runtime via `std::env::var()`. The shipped binary will always read empty string from the process environment unless the var is in the runtime environment.
- **Action:** Change `main.rs:356` to use `env!("LEMON_SQUEEZY_API_KEY", "")` (compile-time) OR document that the key must be in the runtime process environment (e.g., via an `.env` file loaded at startup or CI injection). The current setup works in dev if you set the var in your shell, but the shipped binary won't have it baked in.

**3. Unused Cargo dependencies**
- `Cargo.toml:22` — `tauri-plugin-opener = "2"` — in Cargo.toml but not registered in `main.rs`
- `Cargo.toml:24` — `uuid = { version = "1", features = ["v4"] }` — in Cargo.toml, not imported or used in `main.rs`
- **Action:** Remove unused deps to reduce binary size and avoid license surface.

### 🟡 Pre-launch — must verify before public release

**4. Dev mode hint visible in dev builds**
- `src/components/ExportPanel.tsx:152–155`
  ```tsx
  {import.meta.env.DEV && (
    <p className="text-xs text-neutral-300 text-center mt-2">
      Dev mode: use TEST-XXXX to bypass validation
    </p>
  )}
  ```
- **Status:** This is correctly gated on `import.meta.env.DEV` — it will NOT appear in production builds. No action required, but verify in the production bundle.

**5. `TEST-` prefix bypass in production binary**
- `src-tauri/src/main.rs:359` — `return Ok(license_key.starts_with("TEST-"));`
- This bypass is ONLY active when `LEMON_SQUEEZY_API_KEY` is empty at runtime.
- **Action:** Confirm that the production binary is built with a valid `LEMON_SQUEEZY_API_KEY` set. If the API key is properly embedded/injected, the bypass is unreachable in production. If the key embedding bug (item 2 above) isn't fixed, TEST- keys will work in production.

**6. Hardcoded checkout URL**
- `src/components/ExportPanel.tsx:97` — `href="https://streamsalvage.lemonsqueezy.com/buy/"`
- **Action:** Verify this URL is live and the Lemon Squeezy product is in live mode. The URL is hardcoded and must match the real product URL.

**7. GitHub release URL on landing page**
- `landing/index.html:340,461` — `https://github.com/jabeer4148-ops/StreamSalvage/releases`
- **Action:** Verify the GitHub repo is public and a v1.0.0 release exists before deploying the landing page.

**8. Support email on landing page**
- `landing/index.html:463,446` — `support@recoverrec.com`
- **Action:** Verify this email account is set up and monitored. The FAQ promises "full refund — no questions asked" via this email.

**9. `console.error` statements in production code**
- All in `src/lib/tauriCommands.ts` and `src/hooks/useRepair.ts` — 11 total
- These are `console.error` calls (not `console.log`) and are appropriate for error-path logging. In a Tauri app, `console.error` output goes to the DevTools console (not visible to end users in production builds).
- **Action:** No change required — `console.error` on error paths is good practice. If you want zero console output in production, you can gate these on `import.meta.env.DEV`.

---

## 3. Pre-Launch Checklist

### Code
- [ ] Resolve brand name: choose "StreamSalvage" or "RecoverRec" and update consistently
- [ ] Fix `LEMON_SQUEEZY_API_KEY` embedding: use `env!()` macro OR runtime env var loading
- [ ] Remove unused Cargo deps: `tauri-plugin-opener`, `uuid`
- [ ] Verify `https://streamsalvage.lemonsqueezy.com/buy/` is the live product URL
- [ ] Set up `support@recoverrec.com` email account
- [ ] Verify `.env` is in `.gitignore` (✅ it is — `.local` glob covers `.env.local`; verify `.env` itself is covered)

### Build
- [ ] Run `npm run tauri build` — clean release build with `LEMON_SQUEEZY_API_KEY` set in environment
- [ ] Verify installer artifacts at `src-tauri/target/release/bundle/`
- [ ] Check installer size is acceptable (FFmpeg dominates — likely 60–120 MB)
- [ ] Verify `import.meta.env.DEV` hint is absent in production bundle (inspect built JS)
- [ ] Test installer on a clean Windows machine (no Rust, no Node, no dev tools)
- [ ] Verify FFmpeg binary is present via Git LFS: `git lfs pull`

### Signing
- [ ] Obtain code signing certificate (EV or OV — EV preferred for immediate SmartScreen trust)
- [ ] Sign `StreamSalvage.exe` and installer `.exe` with CodeSignTool or signtool
- [ ] Verify signature: `Get-AuthenticodeSignature .\StreamSalvage.exe`
- [ ] Submit installer to VirusTotal — screenshot clean result for Reddit posts
- [ ] Submit to Microsoft Security Intelligence (WDSI) for reputation seeding: https://www.microsoft.com/en-us/wdsi/filesubmission

### Lemon Squeezy
- [ ] Live mode approved in Lemon Squeezy dashboard
- [ ] Product published in live mode
- [ ] Confirm real product ID matches the one used in API responses
- [ ] `LEMON_SQUEEZY_API_KEY` set in CI/CD secrets (or build environment)
- [ ] `LEMON_SQUEEZY_API_KEY` loaded correctly in production binary (verify with a real key)
- [ ] Checkout URL verified: `https://streamsalvage.lemonsqueezy.com/buy/` loads product page
- [ ] Test purchase end-to-end with a real card in Lemon Squeezy live mode
- [ ] Confirm license key email received from Lemon Squeezy
- [ ] Confirm received key validates successfully in the production app build
- [ ] Confirm refund policy configured in Lemon Squeezy (FAQ promises "full refund — no questions asked")

### Distribution
- [ ] Create GitHub Release v1.0.0 on `jabeer4148-ops/StreamSalvage`
- [ ] Upload signed installer to GitHub Release assets
- [ ] Update `landing/index.html:340` download URL if not using GitHub Releases
- [ ] Deploy landing page (static HTML — any host: Vercel, Netlify, Cloudflare Pages)
- [ ] Verify landing page at production domain (if using streamsalvage.com or recoverrec.com)
- [ ] DNS configured for landing page domain

### Launch
- [ ] Post on r/obs (most relevant — OBS crash is the primary use case)
- [ ] Post on r/Twitch
- [ ] Post on r/buildapc (PC users who record gameplay)
- [ ] Include VirusTotal screenshot in Reddit posts (critical for trust — SmartScreen warning is expected early)
- [ ] Set up F5Bot keyword alerts for "OBS crash recording", "corrupted mp4 fix", "obs recording corrupt"

---

## 4. Known Limitations (v1.0)

| Limitation | Details |
|---|---|
| Windows only | FFmpeg binary is `ffmpeg-x86_64-pc-windows-msvc.exe`; `open_file_in_player` uses `cmd /c start` (Windows-only); macOS planned for v1.1 |
| No cancel during repair | Once FFmpeg starts, there's no way to kill the subprocess from the UI (the state resets but the FFmpeg process continues in background) |
| Progress is simulated | FFmpeg has no progress callback; the 0–90% bar is a 3%/100ms simulation; does not reflect actual FFmpeg progress |
| SmartScreen warning | Unsigned or newly-signed installers show Windows Defender SmartScreen warning; clears naturally after ~500 installs or immediately with EV certificate |
| License requires internet | `validate_license` makes an outbound HTTP call; no offline mode for first activation |
| No auto-update | Users must download and install new versions manually from GitHub Releases |
| No crash reporting | By design (privacy); no telemetry; errors visible only in DevTools console (inaccessible to end users) |
| No in-app video preview | Preview button opens system media player; no embedded video element |
| Synthetic test files may fail | Artificially truncated MP4s don't produce the same MOOV-atom-missing pattern as real OBS crashes; testing requires real crash recordings |
| Output location is fixed | Recovered file lands next to the broken file; user cannot choose pre-repair output location |

---

## 5. Post-Launch Roadmap (v1.1+)

Derived from the codebase's current platform constraints and Tauri's capabilities:

| Feature | Rationale |
|---|---|
| macOS support | Tauri is cross-platform; add `ffmpeg-aarch64-apple-darwin` and `ffmpeg-x86_64-apple-darwin` sidecar binaries; fix `open_file_in_player` for macOS (`open` command) |
| Auto-update | Tauri has a built-in updater plugin (`tauri-plugin-updater`); hook into GitHub Releases |
| FFmpeg progress via WebSocket | Tauri's event system supports real-time events from Rust; pipe FFmpeg `-progress` output to JS for accurate progress |
| Cancel repair | Expose `Child` handle from FFmpeg `Command::spawn()`, wrap in `Arc<Mutex<Option<Child>>>`, kill on "Start over" |
| Multiple file queue | State machine can be extended; add `pendingFiles: string[]` to `RepairState` |
| MKV / AVI support | Extend dialog filters in `tauriCommands.ts`; FFmpeg already handles these containers |
| Dark mode | Tailwind `dark:` variant; add `class="dark"` toggle to root element |
| Drag-and-drop from OS | `tauri-plugin-drag-drop` or Tauri 2's built-in file drop events |
| Audit log export | Users could save the repair log (already in `repairLog: string[]`) as a `.txt` file |

---

## 6. Architecture Decision Records

### ADR-001: Tauri v2 over Electron
**Decision:** Use Tauri 2 as the desktop framework.
**Reason:** Significantly smaller installer than Electron (no bundled Chromium + Node runtime); native Rust backend for file operations and subprocess management; strong security model with capability-based permissions.
**Trade-off:** Rust expertise required for backend changes; smaller plugin ecosystem than Electron; Tauri 2 is newer and breaking changes are possible.

---

### ADR-002: Bundled FFmpeg over system FFmpeg
**Decision:** Bundle `ffmpeg-x86_64-pc-windows-msvc.exe` as a Tauri sidecar binary via Git LFS.
**Reason:** Zero installation requirement for end users; consistent FFmpeg version and flags across all deployments; no "FFmpeg not found" user error in production.
**Trade-off:** Large binary contribution to installer size (~60–120 MB); FFmpeg updates require a new app release; LGPL compliance requires the binary to be replaceable (documented separately).

---

### ADR-003: One-time $29 purchase over subscription
**Decision:** Single payment of $29 via Lemon Squeezy, gated at export.
**Reason:** StreamSalvage is a panic-buy tool — users pay once after a crisis. Subscription model creates friction and churn tracking complexity inappropriate for this use case. One-time price matches user mental model of a utility.
**Trade-off:** No recurring revenue; pricing cannot be changed without affecting existing customers' expectations; no leverage for future feature upgrades.

---

### ADR-004: Local processing over cloud
**Decision:** All MP4 repair runs on the user's machine using the bundled FFmpeg.
**Reason:** Trust is the primary purchase barrier for streamers. Private footage (gaming, personal streams) cannot be uploaded to unknown servers. The landing page explicitly calls out this as a differentiator: "No upload. No sketchy software."
**Trade-off:** Repair quality is limited to FFmpeg's capabilities and the strategies implemented; no server-side ML-based reconstruction; user's hardware is the performance bottleneck.

---

### ADR-005: `useReducer` over `useState` / Zustand
**Decision:** All repair state managed by a single `useReducer` in `useRepair.ts`.
**Reason:** The repair flow is a state machine with ~12 distinct actions and complex transition rules. `useReducer` makes transitions explicit, testable, and auditable. `useState` would create 12+ independent state variables with implicit coupling. No need for cross-component state sharing (all consumed in `App.tsx`), so Zustand's overhead isn't justified.
**Trade-off:** More boilerplate than `useState`; `Action` union type grows as features are added.

---

### ADR-006: Simulated progress bar
**Decision:** Progress is simulated at 3%/100ms (0→90%), snapping to 100% on FFmpeg completion.
**Reason:** FFmpeg's `Command::output()` is blocking and returns only when the process exits — there is no incremental progress callback from Rust to JS mid-execution using the current synchronous subprocess approach.
**Trade-off:** Users see a fake progress curve; the 60-second patience message partially mitigates this for large files. The snap from ~X% to 100% reveals the simulation. A future improvement would pipe FFmpeg's `-progress pipe:1` output through Tauri events.

---

### ADR-007: Three-strategy escalating repair
**Decision:** `repair_with_reference` tries three FFmpeg strategies in order, returning on the first success.
**Reason:** No single FFmpeg invocation handles all corruption patterns. Strategy 1 (stream copy) handles the simplest case quickly. Strategy 2 (reference remap) handles broken MOOV atoms by borrowing the reference container structure. Strategy 3 (genpts + ignore_err) handles timestamp corruption and decode errors that prevent strategies 1 and 2 from parsing the input.
**Trade-off:** Worst case runs three FFmpeg processes sequentially, increasing repair time. The `output_is_valid` check after each strategy prevents false positives from non-zero-exit FFmpeg runs that still produce an output stub.
