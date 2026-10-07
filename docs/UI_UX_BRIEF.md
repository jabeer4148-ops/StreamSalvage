# StreamSalvage — UI/UX Design Brief

---

## 1. Design Philosophy

Derived from the CSS class patterns across all components and `landing/index.html`:

**Flat design with intentional color semantics.** No box-shadows anywhere in the component tree (the landing page CTA is the single exception: `box-shadow: 0 12px 28px rgba(29, 158, 117, 0.24)`). Components use border + background-color to create hierarchy rather than elevation.

**Minimal chrome.** The app window is 780×620 fixed — there is no resize handle, no scrollbar on the main container, and no hamburger menu. The single-column card layout (`max-w-xl`) and fixed window size ensure the design is always in its intended state.

**System-native typography.** The font stack is `system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif` (set in `App.tsx` as `font-[system-ui]`). On Windows this renders in Segoe UI — the same font as Windows itself. This choice reinforces trust: the app feels like an OS utility, not a web app in a wrapper.

**Color as communication, not decoration.** Every color in the app carries a semantic meaning: teal = action/success, red = broken/danger, blue = information/reference, amber = warning/lower success rate. These are never used decoratively.

**Progressive disclosure.** The ReferenceExplainer is always shown (not collapsed) because the reference file concept is non-obvious and critical for success. The NoReferenceWarning is always visible but non-blocking — it informs without preventing action.

---

## 2. Color Palette

All hex values extracted from component source code:

### Primary — Teal `#1D9E75`
Used for:
- All primary CTA buttons (`bg-[#1D9E75]`, `text-white`): "Start Repair", "Verify license key", "Save repaired video to disk", "Unlock full video →"
- Hover state of "Start Repair": `hover:bg-[#188866]`
- Progress bar fill: `bg-[#1D9E75]`
- Percentage counter in RepairProgress: `text-[#1D9E75]`
- Completed step tabs: `text-[#1D9E75]`
- "Repair another file" link: `text-[#1D9E75]`
- Focus ring on DropZone: `focus:ring-[#1D9E75]`
- License key input focus ring: `focus:ring-[#1D9E75]`
- Landing page: `--primary: #1D9E75`; CTA background; step number circles; `<a>` color on summary arrows

### Danger — Red `#E24B4A`
Used for:
- Broken file DropZone border (empty state): `border-[#E24B4A]`
- Broken file DropZone text (empty state): `text-[#E24B4A]`
- Landing page: `--danger: #E24B4A`; `.danger` class

### Reference — Blue `#378ADD`
Used for:
- Reference DropZone border (empty state): `border-[#378ADD]`
- Reference DropZone text (empty state): `text-[#378ADD]`

### Semantic color bands (Tailwind defaults used)

| Semantic | Background | Border | Text | Usage |
|---|---|---|---|---|
| Success | `bg-green-50` | `border-green-200` | `text-green-800`, `text-green-600` | VideoPreview success banner, ExportPanel license-verified |
| Info | `bg-blue-50` | `border-blue-200` | `text-blue-800`, `text-blue-700` | ReferenceExplainer |
| Warning | `bg-amber-50` | `border-amber-200` | `text-amber-800`, `text-amber-700` | NoReferenceWarning, VideoPreview locked badge, ExportPanel unlock box |
| Error | `bg-red-50` | `border-red-200` | `text-red-700`, `text-red-600` | REFERENCE error banner, RepairProgress error, ExportPanel error |
| Log terminal | `bg-neutral-900` | — | `text-green-400` | RepairProgress log output |

### Neutral scale used

| Shade | Usage |
|---|---|
| `neutral-50` / `#f8faf9` | Page background, section backgrounds, DropZone hover, step tabs inactive |
| `neutral-100` | Progress bar track, disabled button background |
| `neutral-200` | All borders (cards, tabs, inputs, dividers) |
| `neutral-400` | Subtext, "Start over" link, secondary copy |
| `neutral-500` | File labels, secondary descriptions |
| `neutral-600` | Body text in info boxes |
| `neutral-700` | Step labels, primary body text, headings |
| `neutral-800` | Strong body text in success/export panels |
| `neutral-900` | Log terminal background |

---

## 3. Component Inventory

### `StepTabs` (`src/components/StepTabs.tsx`)

**Props:** `{ currentStep: AppStep }`

**Visual:** 5-segment horizontal tab bar, border-radius `rounded-xl`, `overflow-hidden` clips the corners of child segments. Segments are `flex-1` (equal width), separated by `border-r border-neutral-200`.

| State | Classes | Text |
|---|---|---|
| Completed (i < currentIndex) | `bg-white text-[#1D9E75]` | "Done {label}" |
| Active (i === currentIndex) | `bg-white text-neutral-700` | "{label}" |
| Future (i > currentIndex) | `bg-neutral-50 text-neutral-500` | "{label}" |

---

### `DropZone` (`src/components/DropZone.tsx`)

**Props:** `{ variant: 'broken' \| 'reference', filePath: string \| null, onClick: () => void, disabled?: boolean }`

**Visual:** Full-width button with `border-2 border-dashed rounded-xl p-6 text-center`.

| State | Broken variant | Reference variant |
|---|---|---|
| Empty border | `border-[#E24B4A]` | `border-[#378ADD]` |
| Empty bg | `bg-white` | `bg-white` |
| Empty hover | `hover:bg-neutral-50` | `hover:bg-neutral-50` |
| Empty icon | 🎬 (text-3xl) | 📹 (text-3xl) |
| Empty title | Red text `text-[#E24B4A]` "Drop your corrupted recording here" | Blue text `text-[#378ADD]` "Drop your reference recording here" |
| Empty subtitle | "or click to browse - .mp4, .mov, .m4v supported" | "Any healthy .mp4 recorded with identical OBS settings" |
| Filled border | `border-neutral-200 border-solid` | same |
| Filled bg | `bg-neutral-50` | same |
| Filled label | "Corrupted file:" (neutral-500) | "Reference file:" (neutral-500) |
| Filled filename | `text-sm font-medium text-neutral-700 truncate max-w-[40ch] mx-auto` | same |
| Filled sub | "Click to change" (neutral-500) | same |
| Disabled | `opacity-50 cursor-not-allowed` | same |
| Focus | `focus:ring-2 focus:ring-offset-1 focus:ring-[#1D9E75]` | same |

---

### `ReferenceExplainer` (`src/components/ReferenceExplainer.tsx`)

**Props:** none

**Visual:** `bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4`. Always rendered on REFERENCE step — not collapsible.

Contains:
- Info icon (`i`, `text-blue-600`, `aria-hidden="true"`)
- Bold question header: "What is a reference file and why do you need one?"
- Explanation paragraph (MOOV atom concept)
- 4-item ordered list with numbered circle badges (`bg-blue-200 text-blue-800`)

---

### `NoReferenceWarning` (`src/components/NoReferenceWarning.tsx`)

**Props:** `{ onSkip: () => void, onUndo: () => void, skipped: boolean }`

**Visual:** `border border-neutral-200 rounded-xl overflow-hidden mb-4` container with toggle button + conditional expanded panel.

| State | Toggle text | Badge | Expanded panel |
|---|---|---|---|
| Not skipped | "I don't have a reference file - skip this step" | "Lower success rate" (amber) | Hidden |
| Skipped | same text | "Skipped - undo?" (amber) | `bg-amber-50 border-t border-amber-200` with ~40%/~85% rates copy |

---

### `RepairProgress` (`src/components/RepairProgress.tsx`)

**Props:** `{ progress: number, log: string[], hasReferenceFile: boolean, repairError: string \| null }`

**Visual elements:**
- Header row: "Repairing your recording..." (neutral-700) + percentage (green `#1D9E75`)
- Progress bar: `bg-neutral-100 rounded-full h-2` track; `bg-[#1D9E75] h-2 rounded-full transition-all duration-300` fill
- Long-wait message: neutral-50 info box after 60s (useState + setTimeout)
- No-reference warning: amber box when `!hasReferenceFile`
- Error panel: red box when `repairError` present
- Log terminal: `bg-neutral-900 rounded-lg p-3 h-32 overflow-y-auto font-mono` — `text-xs text-green-400` per line

**Local state:** `showLongWaitMessage: boolean` managed by `useState + useEffect` with 60,000ms `setTimeout`.

---

### `VideoPreview` (`src/components/VideoPreview.tsx`)

**Props:** `{ repairedFilePath: string \| null, onPlayInPlayer: () => void, onProceedToExport: () => void }`

**Visual:**
- Green success banner (`bg-green-50 border-green-200`) with "OK" prefix (accessible, non-icon)
- Preview block: neutral border, neutral-50 header ("Free preview — first 30 seconds" + amber "🔒 Full video locked" badge), dark (`bg-neutral-900 h-28`) play area
- Play button: circle with "Play" label, `aria-label="Play preview in system media player"`
- Filename: `text-xs text-neutral-400 text-center mb-3 truncate`
- Primary CTA: `bg-[#1D9E75]` "Unlock full video — $29 one-time →"
- Trust copy: "No subscription · instant license key via email"

---

### `ExportPanel` (`src/components/ExportPanel.tsx`)

**Props:** `{ licenseValid: boolean, onCheckLicense: (key: string) => Promise<boolean>, onExport: () => Promise<void>, onReset: () => void }`

**Local state:** `key: string`, `checking: boolean`, `exportStep: ExportStep`, `error: string \| null`

**`ExportStep` states:** `'license' \| 'ready' \| 'saving' \| 'done' \| 'error'`

Key visual details:
- License input: `id="license-key-input"`, `font-mono`, `tracking-wider`, `autoCapitalize="characters"`, `spellCheck={false}`, `autoComplete="off"`
- Input converts to uppercase: `onChange={(e) => setKey(e.target.value.toUpperCase())}`
- Enter key triggers validation: `onKeyDown={(e) => e.key === 'Enter' && handleCheckLicense()}`
- Dev hint rendered only in `import.meta.env.DEV` builds

---

## 4. Step-by-Step Screen Designs

### Step 1: BROKEN
```
┌──────────────────────────────────────────┐
│ Header (border-b border-neutral-100)     │
│  StreamSalvage    [no "Start over" yet]  │
│  MP4 crash recovery - local - no upload  │
├──────────────────────────────────────────┤
│ StepTabs: [Broken│Reference│Repair│...] │
│                                          │
│ h2: Select your corrupted recording      │
│                                          │
│ ┌────────────────────────────────────┐   │
│ │  🎬                                │   │  ← DropZone (red dashed)
│ │  Drop your corrupted recording here│   │
│ │  or click to browse...             │   │
│ └────────────────────────────────────┘   │
│                                          │
│ [Select a file first] (grey, disabled)   │
└──────────────────────────────────────────┘
```

### Step 2: REFERENCE
```
┌──────────────────────────────────────────┐
│ StreamSalvage         [Start over]       │
│ MP4 crash recovery...                    │
├──────────────────────────────────────────┤
│ StepTabs: [Done Broken│Reference│...]    │
│                                          │
│ h2: Add a short healthy recording        │
│ ┌ Corrupted file: video_2024.mp4 ──────┐ │  ← filename info bar
│ └────────────────────────────────────── ┘ │
│ ┌── What is a reference file? ─────────┐  │  ← ReferenceExplainer (blue)
│ │ Your corrupted recording is missing  │  │
│ │ its "playback instructions"...       │  │
│ │ 1. Open OBS, click Start Recording  │  │
│ │ 2. Record 5-10 seconds, stop        │  │
│ │ 3. Find new file in recordings      │  │
│ │ 4. Drag it into box below           │  │
│ └──────────────────────────────────────┘  │
│ ┌────────────────────────────────────┐    │  ← DropZone (blue dashed)
│ │  📹  Drop your reference recording │    │
│ └────────────────────────────────────┘    │
│ ┌────────────────────────────────────┐    │  ← NoReferenceWarning
│ │ I don't have a reference file...  [Lower success rate] │
│ └────────────────────────────────────┘    │
│ [Start Repair] (grey if neither condition)│
└──────────────────────────────────────────┘
```

### Step 3: REPAIRING
```
┌──────────────────────────────────────────┐
│ StreamSalvage         [Start over]       │
├──────────────────────────────────────────┤
│ StepTabs: [Done│Done│Repairing│...]      │
│                                          │
│ h2: Repairing your recording             │
│                                          │
│ Repairing your recording...    67%       │
│ ████████████████████░░░░░░░░░░░░░░░░░░  │  ← progress bar (teal fill)
│                                          │
│ ┌──────────────────────────────────────┐ │  ← log terminal (dark)
│ │ Launching FFmpeg repair process...   │ │
│ │ Reading damaged MP4 container...     │ │
│ │ Applying reference file stream map.. │ │
│ │ (FFmpeg stderr output)               │ │
│ └──────────────────────────────────────┘ │
└──────────────────────────────────────────┘
```

### Step 4: PREVIEW
```
┌──────────────────────────────────────────┐
│ StreamSalvage         [Start over]       │
├──────────────────────────────────────────┤
│ StepTabs: [Done│Done│Done│Preview│...]   │
│                                          │
│ ┌ OK  Repair successful ───────────────┐ │  ← green success banner
│ │     Your recording has been...       │ │
│ └──────────────────────────────────────┘ │
│ ┌──────────────────────────────────────┐ │
│ │ Free preview — first 30 seconds      │ │
│ │                        🔒 Full video │ │
│ │ ┌────────────────────────────────┐   │ │  ← dark preview area
│ │ │      ○ Play                   │   │ │
│ │ │      Open in media player     │   │ │
│ │ └────────────────────────────────┘   │ │
│ └──────────────────────────────────────┘ │
│             Saved to: video_recovered.mp4│
│ [Unlock full video — $29 one-time →]     │  ← teal CTA
│     No subscription · instant key       │
└──────────────────────────────────────────┘
```

### Step 5: EXPORT
```
┌──────────────────────────────────────────┐
│ StreamSalvage         [Start over]       │
├──────────────────────────────────────────┤
│ StepTabs: [Done│Done│Done│Done│Export]   │
│                                          │
│ ┌ Unlock your repaired video ──────────┐ │  ← amber info box
│ │ Enter the license key from your      │ │
│ │ purchase email. Don't have one?      │ │
│ │ Buy for $29 ->                       │ │
│ └──────────────────────────────────────┘ │
│                                          │
│ License key                              │
│ [SS-XXXXXXXX-XXXXXXXX-XXXXXXXX-XXXXXXXX] │  ← monospace input
│ Checked once with streamsalvage.com,     │
│ then remembered on this PC               │
│                                          │
│ [Verify license key]                     │  ← teal CTA
└──────────────────────────────────────────┘
```

---

## 5. UX Decisions & Rationale

| Decision | Rationale (from code/copy) |
|---|---|
| ReferenceExplainer always visible, not collapsible | The reference file concept is non-obvious. Users who don't understand it will skip it and get ~40% instead of ~85%. The explainer is a permanent fixture to maximize that understanding. |
| NoReferenceWarning uses amber (warning), not red (block) | The app does not prevent proceeding without a reference — amber conveys "you should know this, but you can still proceed." Red would imply an error. |
| Preview is free (30 seconds) before paywall | Copy: "Preview the first 30 seconds below for free, then unlock the full video with a one-time purchase." Users only pay once they can see the repair worked. This is the primary conversion mechanism. |
| "Start over" is visible on all steps except the first | On BROKEN, there's nothing to start over from. On all other steps, the user may want to cancel or try a different file. |
| Filename is truncated (not full path) | Full paths are long and contain username/directory info. The filename alone is sufficient to confirm the right file. Full path preserved in `title` attribute for hover access. |
| Progress goes 0–90% then snaps to 100% | FFmpeg has no progress callback. Simulating 0–90% gives visual feedback. The snap to 100% on completion is honest — it doesn't pretend to know FFmpeg's internal completion percentage. |
| Log terminal shown during repair | Trust signal: users can see FFmpeg's actual output and know the app isn't frozen. Informed users are less likely to force-close during a long repair. |
| REPAIR_FAILED returns to REFERENCE (not BROKEN) | The user already selected their broken file. Returning to REFERENCE preserves `brokenFilePath` in state and lets the user try again with a reference file without re-selecting the broken file. |
| License input auto-uppercases | StreamSalvage keys (`SS-XXXXXXXX-XXXXXXXX-XXXXXXXX-XXXXXXXX`) are uppercase, and the server also normalizes to uppercase. Auto-uppercasing prevents copy-paste case errors. |
| "Checked once with streamsalvage.com, then remembered on this PC" | Key is validated against streamsalvage.com/api/validate-license (Upstash Redis), then saved by the app to `%APPDATA%\StreamSalvage\license.json` for future launches. |
| BROKEN step button is disabled once file is selected | The button's job is file selection; once done, it becomes a status indicator ("File selected - continuing") that auto-advances. No manual confirm step needed. |
| repairRunIdRef race condition guard | Prevents a scenario where a user hits "Start over" during repair, then the FFmpeg result comes back and overwrites the fresh BROKEN state. |

---

## 6. Accessibility Notes

| Element | Implementation |
|---|---|
| All buttons | Descriptive text labels (no icon-only buttons) |
| Play button in VideoPreview | `aria-label="Play preview in system media player"` explicitly |
| Success icon in ExportPanel | `role="img" aria-label="Success"` on the 🎉 emoji |
| "OK" in VideoPreview | Rendered as text `aria-hidden="true"` on the inline icon equivalent — accessible as text |
| Info `i` in ReferenceExplainer | `aria-hidden="true"` — decorative; content is in adjacent text |
| License key input | `<label htmlFor="license-key-input">` properly associated |
| Enter key on license input | `onKeyDown={(e) => e.key === 'Enter' && handleCheckLicense()}` — keyboard operable |
| Focus ring on DropZone | `focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-[#1D9E75]` |
| Focus ring on license input | `focus:outline-none focus:ring-2 focus:ring-[#1D9E75] focus:border-transparent` |
| Error states | Use color + text (never color alone): red background AND text copy describing the error |
| Disabled buttons | Both `disabled` attribute AND visual state (`bg-neutral-100 text-neutral-400 cursor-not-allowed`) |

---

## 7. Copy & Messaging

### Instructional copy (ReferenceExplainer)
- "Your corrupted recording is missing its 'playback instructions' — a small block written at the end of the file when recording stops."
- "A **reference file** is any healthy MP4 you recorded with the same OBS settings — it lends its instructions to repair yours."
- 4 steps: "Open OBS, then click Start Recording" / "Record for 5-10 seconds, then click Stop Recording" / "Find the new file in your OBS recordings folder" / "Drag it into the box below"

### Error messages (human-readable, actionable)
- File too small: "File too small to be a valid recording (under 1MB). Are you sure this is the right file?"
- Same file: "Broken file and reference file cannot be the same file."
- FFmpeg missing: "FFmpeg binary not found. Tried multiple locations. Please ensure src-tauri/binaries/ffmpeg-x86_64-pc-windows-msvc.exe exists and Git LFS files are pulled (run: git lfs pull)"
- Stream copy failed: "FFmpeg stream copy could not recover this file."
- Fully corrupted: "Could not reconstruct file. The recording may be too severely corrupted."
- Bad license: "License key not recognized. Check your StreamSalvage purchase email. Keys look like: SS-XXXXXXXX-XXXXXXXX-XXXXXXXX-XXXXXXXX"
- Network error: "Could not verify license - check your internet connection and try again."
- Export failed: "Export failed - the save dialog may have been cancelled, or the destination folder may not be writable. Try again."
- Preview path missing: "Repair completed but output file path is missing. Please restart and try again."

### Success messages
- "Recovery successful." (log)
- "Repair successful" (VideoPreview banner)
- "Your recording has been recovered."
- "Stream copy succeeded." / "Reference remap succeeded." / "Fallback recovery succeeded." (log)
- "License verified - ready to export"
- "File saved successfully"
- "Your recovered recording is ready to use."

### CTA copy (buttons)
- "Select a file first" / "File selected - continuing"
- "Start Repair"
- "Start over"
- "I don't have a reference file - skip this step"
- "Verify license key" / "Verifying..."
- "Save repaired video to disk" / "Saving..."
- "Unlock full video — $29 one-time →"
- "Repair another file"
- "Buy for $29 ->"

### Trust signals
- "MP4 crash recovery - local - no upload" (app subtitle)
- "Free preview — first 30 seconds"
- "No subscription · instant license key via email"
- "Checked once with streamsalvage.com, then remembered on this PC"
- "Save to any folder - keeps original untouched"
- Landing: "your files never leave your PC"
- Landing: "No command line. No upload. No sketchy software."

### Warning messages (amber)
- NoReferenceWarning: "Without a reference file, recovery uses FFmpeg stream repair - success rate ~40%. With a reference file, success rate rises to ~85%. We strongly recommend creating one first (10 seconds in OBS)."
- RepairProgress: "Running without reference file - if this fails, try again with one."
- RepairProgress: "Still working... Large files can take a few minutes."
- VideoPreview: "🔒 Full video locked"
- ExportPanel: "Unlock your repaired video"
