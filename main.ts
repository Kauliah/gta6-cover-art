// Vice City Cover Maker — the entrypoint for make.fun's gta6-cover-art-01.
//
// The app is plain static files in app/ (index.html plus its modules, styles,
// the bundled Anton display font and two sample photos) and the screenshots
// in screenshots/. This program hands both in: it copies them into the
// grader's output directory and writes dossier.json there, using the kit's
// vendored library to summarise the app for the judge.
//
// Node 22, standard library only, erasable TypeScript only. Run it twice and
// both runs write identical bytes. Outside the grader, MAKEFUN_OUTPUT_DIR
// stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Copy the whole static app, then the screenshots, into the output dir.
mkdirSync(outputDir, { recursive: true });
cpSync(join(repoRoot, 'app'), join(outputDir, 'app'), { recursive: true });
mkdirSync(join(outputDir, 'screenshots'), { recursive: true });
if (existsSync(join(repoRoot, 'screenshots'))) {
  cpSync(join(repoRoot, 'screenshots'), join(outputDir, 'screenshots'), { recursive: true });
}

// Build the dossier from what was just copied, under the same caps the
// scorer enforces: at most 160 KiB of source text, 4 screenshots of at most
// 256 KiB each, app/ within 993 files and 48 MiB.
writeFileSync(
  join(outputDir, 'dossier.json'),
  buildDossier(outputDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
    app_path_max_bytes: 1000,
  }),
);
