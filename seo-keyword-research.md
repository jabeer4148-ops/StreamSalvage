# StreamSalvage — SEO Keyword Research (Reddit + forum demand signals)

Updated 2026-07-08. Sources: ~36 Reddit threads (user-curated dataset) + live web searches of OBS Forums, GoPro Community, DJI Forum, VideoHelp. Note: Reddit URLs in the curated dataset were placeholder slugs — phrasing is treated as verbatim user language, links are not cited.

## How people actually phrase the problem (title gold)

- "OBS crashed mid-stream and now my 4 hour recording is a corrupt MP4. Am I screwed?"
- "The file size looks right (around 12GB) but VLC won't open it"
- "How to uncorrupt a mp4"
- "moov atom not found" / "unindexed or unfinalized"
- "camera died while recording" / "battery popped out"
- "my pc turned off before ending video on streamlabs"
- "computer BSOD'd and corrupted the recording"
- "video plays on my camera but is 0 KB once uploaded"
- "it's just a black thumbnail and won't load"
- "'Corrupt' mp4 won't play in any player... besides my editor"
- "Every website I find online asks for $30 to download the fixed version"

## Keyword clusters → content

### 1. Crash/interruption scenarios (highest intent, perfect product fit)
`obs crashed recording corrupt mp4` · `streamlabs pc turned off recording corrupted` · `obs bsod recording recovery` · `nvenc encoder error recording unfinalized` · `camera died while recording fix` · `camera overheated video corrupted` (Sony a6400) · `drone lost power video unplayable` · `power outage mp4 corrupt`

Content: "OBS Crashed Mid-Recording? Repair the MP4" (also cover Streamlabs), "Camera Overheated Mid-Shoot — Recover the Clip", "Drone Powered Off Before Saving".

### 2. Error codes & technical strings (exact-match, low competition, ultra-high intent)
`moov atom not found` (flagship) · `0xc00d36c4` · `0xc00d5212` · `0xc10100be` · `ffmpeg invalid data found when processing input` · `unfinalized mp4` · `truncated mp4 repair` · `0 KB video file error` · `mp4 unindexed`

Content: one page per error string. 0xc00d5212 has international volume too (Dutch thread found: "codec ontbreekt").

### 3. Symptom phrases (how non-technical users search)
`video file size correct but won't play` · `mp4 black thumbnail won't load` · `video plays in editor but not media player` · `video plays on camera but not computer` · `vlc says file is corrupted` · `mp4 freezes media player`

Content: FAQ entries + symptom-based landing copy. These convert because the user recognizes their exact situation.

### 4. Device-specific
GoPro (Hero 10/11, SOS repair fails, "pulled the card too fast") · DJI Mini 3 Pro · budget cams (Dragon Touch, Snaptain — corruption-prone, owners won't pay $70 recovery tools) · dashcam (Viofo, accident footage — legal stakes) · Sony A7III/a6400 · Panasonic GH6 · iPhone/Android ("phone died at 0% while recording")

Content: per-device guides. Angles: "When GoPro SOS Repair Fails", "Recover Dashcam Crash Footage" (insurance/legal urgency = high willingness to pay).

### 5. Pro-workflow file states (high-value professional traffic)
`.mdt file recovery` (Panasonic GH5/GH6 leaves .mdt after power loss — raw stream that should've been an MP4) · `.rec to mp4 converter` · `recover h264 stream from corrupt mp4` · `extract audio from corrupt mp4` (podcasters only want the voice track)

Content: ".MDT File Recovery Explained" — blog gold, little competition, videographer audience.

### 6. Tool-evaluation & trust searches (conversion pages)
`untrunc gui` / `untrunc alternative` · `recover_mp4 how to use` · `repair mp4 with reference file` · `free video repair no upload` · `video repair not a scam` · `grau video repair alternative` · `wondershare repairit alternative free`

Pain points to hit in copy: fear of scam sites, $30 paywall-after-preview resentment, CLI/GitHub intimidation, huge files (12GB–120GB) that can't be uploaded to online tools. **StreamSalvage's pitch writes itself: local, private, GUI, no upload limit, reference-file repair like untrunc without the terminal.**

### 7. Prevention/PSA content (link magnets)
"Never record directly to MP4 in OBS" (225-upvote PSA) → "MKV vs MP4 vs Fragmented MP4 for OBS: What Survives a Crash" · SD card health / write-speed guides · "record to dual cards" caveat (A7III wedding thread: corrupted on BOTH cards)

These earn links/shares and catch users *before* disaster — retarget later.

## Solution landscape (what users try before finding you)

1. OBS remux (fails when moov atom never written)
2. VLC "fix on open" (AVI-only, fails on MP4 — common dead end to call out)
3. Rename extension (.mov/.avi — fails)
4. Device self-repair (GoPro SOS, iPhone overnight-charge daemon — works sometimes; tell users to try free options first, builds trust)
5. CLI: untrunc, recover_mp4, ffmpeg `-err_detect ignore_err` (works, intimidating)
6. Paid: Wondershare Repairit, Grau, Fix.Video, Stellar (paywall resentment)

Position StreamSalvage as step 5's power with step 4's ease.

## Priority order

1. `moov atom not found` landing page
2. `obs crashed recording corrupted` guide (+ Streamlabs/BSOD variants)
3. Error-code pages: 0xc00d36c4, 0xc00d5212, 0xc10100be, ffmpeg invalid data
4. `untrunc gui / alternative` + "repair mp4 with reference file" page
5. `.mdt recovery` blog post (pro traffic)
6. Device guides: GoPro → dashcam → DJI → phone → budget cams
7. OBS MKV/fMP4 prevention PSA (link magnet)

## Phase 2 additions (70-thread dataset, 2026-07-08)

New keyword targets, in priority order:

1. `how to uncorrupt a mp4` — verbatim title, appears twice; naive phrasing = beginner traffic no competitor targets. Candidate page: "How to Uncorrupt an MP4 (Yes, It's Usually Possible)".
2. `gopro battery died recover footage` — 8+ threads; the single most repeated device scenario. Worth its own page separate from the general GoPro guide (it currently covers this in one section).
3. `0xc00d36e5` — new error code found ("item is unplayable, please reacquire"), phone→USB transfer corruption. Now mentioned on the 0xc00d36c4 page; could become its own page.
4. `sony a7iii corrupted mp4` / "21.4 GB of Heartbreak" — 100+ upvote thread; mirrorless power-loss cluster (a7 III, a6400, Canon 700D/C70/R5II).
5. `canon dat file recovery` — Canon's equivalent of Panasonic's .mdt (R5II leaves .DAT after crash). Companion to the mdt page.
6. `screen recording 4gb corrupted` — Android recorders break at the 4 GB FAT32 boundary; distinct cause, distinct keyword.
7. `extract audio from corrupt mp4` — podcasters who only need the voice track.
8. `bandicam corrupted recording` / `elgato bsod recording glitchy` — smaller recorder-specific tails.

Competitive intel from the dataset: users try 4–6 tools before giving up (Wondershare, EaseUS, Stellar, Remo, untrunc-GUI all failed on one 6-tool thread; VLC "repair" produces 1 KB files on MP4s). "The tool to try before you give up" is a defensible positioning line, and the 6-tool failure thread is the case-study template.

Emotional copy bank (verbatim): "21.4 GB of heartbreak", "is all lost", "3 hours of festival footage", "hex detectives assemble", "far more trouble than it's worth".

Caution: the dataset summary claims "no-donor-needed" is StreamSalvage's differentiator — that's wrong. StreamSalvage's reference-guided repair IS the donor-file method (that's the ~85% path; no-reference stream copy is ~40%). The real differentiators: the app walks you through *creating* a reference clip when you don't have one (OBS: just record 10 seconds), plus local/GUI/free-preview. Don't ship copy claiming no reference is needed.

## Verified sources (forums)

- https://obsproject.com/forum/threads/pc-hard-crashed-during-recording-how-do-i-actually-repair-the-file.139236/
- https://www.handyrecovery.com/moov-atom-not-found/
- https://community.gopro.com/s/question/0D5Uv000002nDCxKAM/repairing-file-bug
- https://forum.dji.com/thread-130616-1-1.html
- https://forum.videohelp.com/threads/367506-Help-with-Corrupted-wedding-video
- https://github.com/anthwlock/untrunc
- https://learn.microsoft.com/en-us/answers/questions/4207768/error-code-0xc00d36c4
