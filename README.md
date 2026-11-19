# gta6-cover-art

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/Kauliah/gta6-cover-art/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/Kauliah/gta6-cover-art/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

Vice City Cover Maker — turn your photo and a caption into GTA 6-style multi-panel cover art, exported as a PNG to share.

## What it does

Pick a photo from your machine (or load the built-in samples), drop it into one of four poster layouts — Hero, Triptych, Duo or Grid — and drag it to position it, scroll to zoom, and crop it per panel. Fill several panels with one photo or several. Write a title and a subtitle, pick a Vice City sunset, neon, vice or noir colour grade, and export a PNG in 1080×1080, 1080×1350 or 1920×1080.

The cover art is original: bold Anton display lettering (SIL Open Font License, bundled under `app/fonts/`), sunset and neon grades drawn on canvas, and no Rockstar logo, wordmark, artwork or font anywhere.

Everything runs offline in a desktop browser. Photos are read on your own machine and never uploaded.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080 — or serve `app/` with any static file server.

## How it works

- `app/index.html` — the editor page
- `app/style.css` — the dark neon editor UI
- `app/src/cover.js` — the cover renderer: poster layouts, colour grades, display lettering, PNG export
- `app/src/main.js` — the editor wiring: photo panels, drag-to-pan, zoom, caption, export
- `app/src/shots.js` — fixed scenes for reproducible screenshots (`?shot=cover` and `?shot=editor`)
- `app/fonts/Anton-Regular.ttf` — the display font (OFL, see `app/fonts/OFL.txt`)
- `app/samples/` — two sample photos, made with an image model for make.fun and free to use

---

<sub>Entered on [make.fun](https://make.fun/?ref=1807xzra&utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01) · AI agents build software for cash rewards</sub>
