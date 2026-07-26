# 10 Tabs Open

Ashwin Sheoran’s single-page creative CV, built as a responsive editorial
experience with React, TypeScript, Vite, Tailwind CSS, and Motion.

## Requirements

- Node.js 20.19 or newer
- npm 10 or newer

## Local development

Install dependencies and start the Vite development server:

```bash
npm install
npm run dev
```

Open `http://127.0.0.1:5173/`. Do not open `index.html` directly and do not use
VS Code Live Server or its **Go Live** button: those bypass Vite's React,
TypeScript, and asset pipeline and can produce a blank page.

Create and preview the production build:

```bash
npm run build
npm run preview
```

Run the complete local quality gate (ESLint, TypeScript, unit tests, and the
production build):

```bash
npm run check
```

Useful focused commands:

```bash
npm run lint
npm run typecheck
npm run test
npm run test:watch
npm run test:coverage
```

Playwright needs a browser binary once per machine:

```bash
npx playwright install chromium webkit
npm run test:e2e
```

`test:e2e` creates a production build before running desktop Chromium, desktop
WebKit, and mobile Chromium. The deployment-path variants are:

```bash
npm run test:e2e:root
npm run test:e2e:subpath
```

The second command builds and tests the site at the representative
`/creative-cv/` project path.

## Architecture

- `src/data/profile.ts` is the typed content source of truth for navigation,
  timeline entries, interests, side quests, strengths, bugs, rapid-fire facts,
  contact values, and interaction copy.
- `src/App.tsx` composes the eleven page sections and their stateful behavior,
  including counters, tabs, bug controls, the “DO NOT CLICK” response, and the
  `CRICKET` keyboard sequence.
- `src/components/ExperienceChrome.tsx` owns the sticky navigation, loading
  progress, and scorecard easter egg.
- `src/components/EditorialVisuals.tsx` contains reusable, deterministic SVG
  artwork. These visuals are code, stay sharp at every size, and expose
  decorative or labelled accessibility behavior.
- `src/lib/publicAsset.ts` resolves files in `public/` against Vite's normalized
  base URL so the same build works at the domain root and a repository path.
- `src/styles.css` contains the Tailwind v4 import, design tokens, responsive
  editorial compositions, textures, focus states, and reduced-motion rules.
- `public/` contains only static files served from the site root. There is no
  backend, database, API route, analytics client, or runtime data request.

## Assets

- `BG_Video.mp4` is the untouched supplied source video and retains its original
  embedded C2PA provenance.
- `public/hero-scroll.mp4` is the 1280×720, 24 fps H.264 runtime derivative. It
  has a keyframe every six frames (0.25 seconds), `yuv420p` pixel format,
  fast-start metadata, and no unused audio so proportional seeking remains
  responsive in Chrome and Safari. Re-encoding necessarily invalidates signed
  C2PA manifests, so provenance remains attached only to the source.
- `public/hero-poster.webp` is frame zero regenerated from the final video
  source. Reduced-motion, narrow, coarse-pointer, Data Saver, and video-error
  cases render this poster without mounting the video.
- `AshwinSheoranCVFilled.pdf` is the supplied source résumé.
  `public/Ashwin-Sheoran-CV.pdf` is its stable public URL.
- `public/assets/editorial/technical-collage.webp` is the one AI-generated,
  text-free editorial raster. Its prompt and transformation history are in
  `docs/image-prompts.md`.
- Archivo Black, Space Grotesk, and IBM Plex Mono are bundled through
  Fontsource packages; the site does not fetch web fonts at runtime.
- `public/assets/photography/` is intentionally empty apart from `.gitkeep`.
  Synthetic personal photographs are not used.

### Add real photography

1. Export genuine photographs as appropriately sized WebP or AVIF files and
   place them in `public/assets/photography/`.
2. In the `photography` branch of `InterestArtwork` in `src/App.tsx`, replace
   the empty `PhotographyVisual` with semantic `<figure>` and `<img>` elements
   that reference `/assets/photography/<filename>`.
3. Give each informative image concise alt text. Use `alt=""` only when the
   same information is already present in adjacent copy.
4. Keep the existing contact-sheet grid and mobile overflow behavior when
   styling the real images.

## Contact configuration

LinkedIn and the downloadable CV are configured in `src/data/profile.ts`.
The website intentionally contains no email address or email action.

## Accessibility and motion

- The page includes a skip link, visible focus rings, semantic landmarks,
  labelled controls, polite live regions, accessible meters, and text
  equivalents for animated counters.
- Open Tabs follows the ARIA tab pattern and supports Left/Right Arrow, Home,
  and End keys.
- `MotionConfig` uses the visitor’s operating-system reduced-motion preference.
  The app also checks that preference directly to render the Hero poster,
  resolve counters immediately, remove reveal motion, and stop ticker effects.
- On capable fine-pointer layouts wider than 900px, the Hero video is paused and
  scrubbed by native scroll progress inside a temporary sticky sequence. It
  never autoplays or loops, and the Hero naturally releases after its scroll
  container ends.
- The site always uses the native browser and operating-system cursor. It does
  not install pointer-following listeners or alter wheel and trackpad behavior.
- Unit tests use Vitest and Testing Library. End-to-end accessibility checks use
  Playwright and axe.

## Base-path builds

`SITE_BASE_PATH` controls Vite's public base. Empty values and `/` normalize to
the domain root; values such as `creative-cv`, `/creative-cv`, and
`/creative-cv/` all normalize to `/creative-cv/`.

Verify a root build:

```bash
SITE_BASE_PATH=/ npm run build
npm run preview
```

Verify a repository-subpath build:

```bash
SITE_BASE_PATH=/creative-cv/ npm run build
SITE_BASE_PATH=/creative-cv/ npm run preview
```

The second preview is available at
`http://127.0.0.1:4173/creative-cv/`. Check that the JavaScript, CSS, fonts,
video, poster, collage, favicon, and PDF all load from that prefix.

## GitHub Pages

The workflow in `.github/workflows/deploy-pages.yml` deploys `dist/` after each
push to `main` and can also be run manually. It asks GitHub Pages for the
repository's exact `base_path` and passes that value to the Vite build, so no
repository name is hardcoded.

For a personal site:

1. Create or use the repository `username.github.io`.
2. Push this project to its `main` branch.
3. In **Settings → Pages → Build and deployment**, choose **GitHub Actions** as
   the source.
4. Run the **Deploy to GitHub Pages** workflow or push to `main`. GitHub reports
   an empty base path, so the site builds for `/`.

For a normal project site:

1. Push this project to a repository such as `creative-cv`.
2. In **Settings → Pages → Build and deployment**, choose **GitHub Actions** as
   the source.
3. Run the **Deploy to GitHub Pages** workflow or push to `main`. GitHub reports
   `/creative-cv` as the base path, and the workflow builds all assets beneath
   `/creative-cv/` automatically.

`public/.nojekyll` is included in every build. No API routes, server actions, or
runtime server rendering are required. Other static hosts, including Vercel,
continue to use the root default unless `SITE_BASE_PATH` is explicitly set.
