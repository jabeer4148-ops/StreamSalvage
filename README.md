# StreamSalvage

Desktop app for recovering corrupted MP4 recordings (OBS crashes, stream drops). Runs 100% locally — no upload, no cloud.

Built with Tauri 2 + React + TypeScript. FFmpeg bundled as a sidecar binary.

## How it works

1. Drop your corrupted `.mp4` / `.mov` / `.m4v`
2. Optionally add a healthy reference recording (same encoder settings) for a higher success rate
3. StreamSalvage runs FFmpeg to recover the file
4. Preview the result, then save to a destination of your choice

**Success rates:** ~40% without reference file, ~85% with reference file.

## Dev setup

```bash
npm install
npm run tauri dev
```

Requires:
- [Rust](https://rustup.rs/) (stable)
- [Node.js](https://nodejs.org/) 18+
- `binaries/ffmpeg` (platform binary, not committed — download separately)

## Build

```bash
npm run tauri build
```

## Recommended IDE

VS Code + [Tauri extension](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) + [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)

## Architecture

See [ARCHITECTURE.md](ARCHITECTURE.md) for component diagram and data flow.
