# StreamSalvage: first links (directory submission kit)

Prepared 2026-10-07. Goal: get streamsalvage.com its first links from other sites (Search Console showed **0 external links**), using only self-serve listings. No cold outreach.

Brand assets for every listing are in `brand/`:
- `logo.svg`, `logo-512.png`, `logo-256.png`, `logo-32.png`
- `favicon.ico` (16/32/48) and `apple-touch-icon.png` (180)
- `screenshots/` (4 app screenshots, 1560 px wide)

## Order of work

| # | Where | Account? | Link type | Blocked by | Status |
|---|---|---|---|---|---|
| 0 | Ship the new icon (site favicon + app icon, release v1.0.1) | none | n/a | none | ☐ |
| 1 | GitHub repo: website field + README link | have it | nofollow, but GitHub is crawled constantly | none | ☐ |
| 2 | AlternativeTo: new listing + "alternative to" untrunc / Stellar / Repairit | yes | reported dofollow* | none (logo upload only) | ☐ |
| 3 | Softpedia: submission form | form | varies | step 0 (they install and screenshot the app) | ☐ |
| 4 | FileHorse: contact-form submission | form | varies | step 0 | ☐ |
| 5 | winget: PR to microsoft/winget-pkgs | GitHub | indirect: winget catalog sites mirror the homepage link | step 0 (submit the new installer) | ☐ |
| 6 | MajorGeeks: email submission | email | varies | step 0 | ☐ |
| opt | OBS Forums → Resources | yes | forum link | read the policy notes below first | ☐ |

\*Link types come from third-party directory roundups, not the sites themselves. Check after listing with "Inspect" on the link (look for `rel="nofollow"`). Nofollow listings are still worth having: they get Google crawling the site and send real visitors.

Review times: AlternativeTo "a couple of days up to a week"; Softpedia "up to 30 days, not guaranteed"; FileHorse and MajorGeeks unstated. Both download sites test the installer with VirusTotal / hands-on before listing.

---

## Copy to paste (same facts everywhere)

**Name:** StreamSalvage
**Website:** https://www.streamsalvage.com/
**Download (direct):** https://github.com/jabeer4148-ops/StreamSalvage/releases/download/v1.0.0/StreamSalvage_1.0.0_x64-setup.exe
*(swap in the v1.0.1 URL once released)*
**Second download link (Softpedia asks for two):** https://www.streamsalvage.com/#download
**Version:** 1.0.0 · **Installer:** 46.7 MB, x64 NSIS setup
**OS:** Windows 10 / 11 (64-bit). Uses the Microsoft Edge WebView2 runtime, which is built into Windows 11 and most up-to-date Windows 10.
**License type:** Trial / Demo (free repair + preview; $29 one-time to export the full file). On AlternativeTo: *Commercial*, with free trial.
**Price:** $29 one-time, no subscription. Full refund if it doesn't work.
**Developer:** Abdul Jabeer Shaik · support@streamsalvage.com
**Category:** Multimedia → Video → Video repair / video tools
**Tags:** video repair, mp4 repair, obs, corrupted video, moov atom, file recovery, screen recording

**Tagline (54 chars, fits 60-char limits):**
> Repair corrupted OBS MP4 recordings locally on Windows

**Short description (224 chars, fits 250-char limits):**
> Fix crashed OBS recordings that won't play. Drop in the broken MP4, add a short clip recorded with the same settings, and StreamSalvage rebuilds the file on your PC. Nothing is uploaded. Free preview; $29 one-time to export.

**Long description:**
> When OBS crashes, the PC loses power, or a recording is stopped badly, the MP4 often never gets its index (the "moov atom") written. The video data is still there, but players refuse to open the file.
>
> StreamSalvage is a small Windows app that repairs those files without the command line. Drop in the broken recording, then add a short healthy clip recorded with the same OBS settings. StreamSalvage uses that reference clip to rebuild the missing index and re-mux your footage. Everything runs locally with a bundled FFmpeg, so private streams and client footage never leave your PC.
>
> You see whether the repair worked before you pay: repair and preview are free, and a one-time $29 license unlocks export of the full file. If it doesn't work for your file, you get a full refund.
>
> Built for interrupted OBS MP4 recordings. Other interrupted MP4/MOV files from cameras and phones may also be repairable when their media data survived. Recovery is never guaranteed: missing data or disk damage can make a file unrecoverable.

**Feature bullets:**
- Repairs MP4 / MOV / M4V files with a missing or broken moov atom
- Reference-clip repair for interrupted OBS recordings
- 100% local processing; no upload, no account
- Free repair and preview before you buy
- Guided drag-and-drop steps; no FFmpeg commands to learn
- One-time $29 license, no subscription

**Screenshot captions (match `brand/screenshots/`):**
1. `1-select-file.png`: Drop in the corrupted recording
2. `2-reference.png`: Add a short clip recorded with the same OBS settings
3. `3-repairing.png`: Repair runs locally with the bundled FFmpeg
4. `4-preview.png`: Preview the result before you pay

*Screenshots are the real app UI rendered with a simulated successful repair (sample file names). Retake them from the installed v1.0.1 if you want Windows-native fonts.*

---

## Per-site notes

### 1. GitHub
- Set the repo's website and description. GitHub also shows the description in search.
- Add a link and one screenshot near the top of `README.md`.

### 2. AlternativeTo: https://alternativeto.net/software/new/
- Sign up, then User menu → *Suggest new application*. English-only. Paid apps are allowed.
- Platform: Windows. License: Commercial. Add the tags above.
- After approval, open the untrunc, Stellar Repair for Video and Wondershare Repairit pages and suggest StreamSalvage as an alternative. Your comparison guides target exactly these searches.
- Their rules: no incentivised upvotes, no sock-puppet reviews.

### 3. Softpedia: https://www.softpedia.com/user/submit.shtml
- Use the regular form (no PAD file needed). Fields: developer info, name/version/category, size, OS, 32×32 icon (`logo-32.png`), screenshots, descriptions, two download links, license and price.
- License: *Demo* or *Trial*. Up to 30 days, not guaranteed.

### 4. FileHorse: https://www.filehorse.com/submit/ (links to their contact form)
- Send: name and version, website, download link, license type (Demo/Trial), description and main features. Optional: 256 px icon (`logo-256.png`) and screenshots.
- They test with VirusTotal and Google Safe Browsing before listing.

### 5. winget
- Easiest path: Microsoft's `wingetcreate` tool. It downloads the installer, computes the hash, writes the manifests and opens the PR against microsoft/winget-pkgs.
- Suggested identifier: `StreamSalvage.StreamSalvage`. Publisher: StreamSalvage. License: Proprietary. Homepage: https://www.streamsalvage.com/
- The PR runs automated install validation. Tauri's NSIS installer supports the silent `/S` switch it needs.

### 6. MajorGeeks: mgnews AT majorgeeks.com (their stated address for file submissions)
Draft:

> **Subject:** Software submission: StreamSalvage 1.0.1 (Windows, MP4 repair)
>
> Hi MajorGeeks team,
>
> I'd like to submit StreamSalvage for review. It's a Windows app that repairs MP4 recordings left unplayable after OBS crashes or power loss, using a reference clip to rebuild the missing moov atom. Processing is fully local.
>
> - Website: https://www.streamsalvage.com/
> - Direct download: [v1.0.1 installer URL]
> - License: Demo (free repair and preview; $29 one-time to export)
> - OS: Windows 10/11 x64
>
> Thanks for considering it.
> Abdul Jabeer Shaik, support@streamsalvage.com

### Optional: OBS Forums → Resources
The audience fits best, but check the [Forum Resource and IP Policy](https://obsproject.com/forum/threads/forum-resource-and-ip-policy.195980/) first:
- "OBS" can't appear in the resource title.
- Descriptions must not read mainly as an advertisement.
- AI-generated code needs a detailed disclaimer.
- The policy doesn't say whether paid, closed-source standalone tools are allowed. If unsure, skip it rather than risk a removal on the forum your buyers use.

---

## Commands (step 0 and step 1)

Run from `C:\my_repo\StreamSalvage`.

**0a. Website favicon.** Copies the icons into the site and adds the `<link>` tags to every page (safe to re-run):
```
python brand\add_favicon.py
```
Then bump `CONTENT_VERSION` in `landing/pages/[[...path]].js` (stale-trace rule) and deploy as usual.

**0b. App icon.** Regenerates every Tauri icon size from the new logo:
```
npx tauri icon brand\logo-512.png
```
Then bump `version` to `1.0.1` in `src-tauri/tauri.conf.json`, run `npm run tauri build` (no payment keys needed; the app checks licenses against your site's API), and publish release `v1.0.1` with the new `StreamSalvage_1.0.1_x64-setup.exe`. Update the download link in `landing/public/index.html`.

**1. GitHub repo metadata:**
```
gh repo edit jabeer4148-ops/StreamSalvage --homepage "https://www.streamsalvage.com/" --description "Repair corrupted OBS MP4 recordings locally on Windows" --add-topic obs --add-topic mp4-repair --add-topic video-repair --add-topic tauri
```

**5. winget (after v1.0.1 is public):**
```
winget install Microsoft.WingetCreate
wingetcreate new https://github.com/jabeer4148-ops/StreamSalvage/releases/download/v1.0.1/StreamSalvage_1.0.1_x64-setup.exe
```
Follow the prompts and choose to submit at the end. It asks for a GitHub token.
