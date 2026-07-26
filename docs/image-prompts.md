# Image and visual provenance

This project contains one AI-generated raster asset. The Hero poster is derived
from the user-supplied video; every other editorial diagram, texture, and
composition is authored in React SVG or CSS.

## AI-generated technical collage

Production asset:
`public/assets/editorial/technical-collage.webp`

Original generated PNG:
`/Users/ashwinsheoran/.codex/generated_images/019f9932-cd0e-71a1-89d7-3c4fbfdb2134/exec-8a073f77-a2f9-4a3f-91e2-f9cc8c2c4a9f.png`

Exact built-in image generation prompt:

```text
Use case: stylized-concept
Asset type: wide editorial website section artwork
Primary request: a black-and-white technical collage that feels like a brutalist digital magazine, an overworked product notebook, and a photocopied systems diagram
Scene/backdrop: warm off-white fibrous paper with layered torn-paper edges, crop marks, registration marks, faint grids, browser-window fragments, unlabeled flowchart boxes, banking-interface wireframes, abstract code columns, sprint-board geometry, candlestick-like marks, camera contact-sheet frames, and engineering schematics
Style/medium: high-contrast screen print, xerox photocopy, halftone ink, editorial cut-and-paste collage, deliberately imperfect but carefully composed
Composition/framing: wide landscape composition with strong asymmetry, dense detail around the outer thirds, one calmer central band for page content to cross over, flat front-facing print artwork
Color palette: predominantly warm white and rich black, with extremely sparse electric blue, aqua, and acid-yellow registration accents
Materials/textures: rough toner, ink bleed, paper grain, tape ghosts, misregistration, clipped rules, scuffed edges
Constraints: purely abstract editorial systems imagery; no readable words, letters, numbers, logos, trademarks, people, faces, hands, photographs, product packaging, beauty imagery, gradients, glossy rendering, dimensional mockups, or watermark
Avoid: stock-photo aesthetic, polished corporate infographic, generic AI art, glossy 3D, cyberpunk neon, pastel beauty branding, legible pseudo-text
```

The original PNG was converted to the production WebP without further
generative editing:

```bash
cwebp -quiet -q 82 '/Users/ashwinsheoran/.codex/generated_images/019f9932-cd0e-71a1-89d7-3c4fbfdb2134/exec-8a073f77-a2f9-4a3f-91e2-f9cc8c2c4a9f.png' -o public/assets/editorial/technical-collage.webp
```

The asset is retained with its provenance record but is not rendered by the
current website.

## Hero video and poster

Source video: `BG_Video.mp4`

Scroll-scrubbing derivative: `public/hero-scroll.mp4`

The supplied source is preserved byte-for-byte at the project root. Its
SHA-256 digest is:

```text
d7980d1d77ea34ff93ae4279f425650a67b76953a54e301142742a31fdec0928
```

The source contains a signed C2PA manifest. Because video re-encoding changes
the media essence, the runtime derivative does not and cannot retain that
signature as a valid manifest; the unchanged root source remains the
provenance-bearing original.

The public derivative was encoded specifically for responsive scroll seeking:

```bash
ffmpeg -i BG_Video.mp4 \
  -map 0:v:0 \
  -c:v libx264 \
  -preset slow \
  -crf 18 \
  -pix_fmt yuv420p \
  -profile:v high \
  -level 3.1 \
  -movflags +faststart \
  -g 6 \
  -keyint_min 6 \
  -sc_threshold 0 \
  -an \
  public/hero-scroll.mp4
```

The result is a 10-second, 1280×720, 24-fps H.264 High Profile Level 3.1 MP4
using `yuv420p`, with 40 keyframes spaced 0.25 seconds apart. It contains no
audio stream. The `moov` atom precedes `mdat` for fast-start delivery.

Frame zero of that final derivative was extracted losslessly and encoded as
the production poster:

```bash
ffmpeg -i public/hero-scroll.mp4 \
  -vf 'select=eq(n\,0)' \
  -frames:v 1 \
  -update 1 \
  /private/tmp/creative-cv-hero-poster.png

cwebp -quiet -q 84 -resize 1280 720 \
  /private/tmp/creative-cv-hero-poster.png \
  -o public/hero-poster.webp
```

Neither the derivative nor the Hero poster passed through a generative model.

## Code-authored visuals

The following exports in `src/components/EditorialVisuals.tsx` are
deterministic React SVG and are **not AI-generated**:

- `CricketVisual`: field map, pitch, fielders, and wagon-wheel diagram.
- `MarketsVisual`: candlesticks, abstract price line, and watchlist panel.
- `GamingVisual`: pixel geometry, game HUD, and mission-complete graphic.
- `CodingVisual`: terminal fragments, component boxes, and deployment flow.
- `PhotographyVisual`: deliberately empty genuine-photography contact sheet.
- `HandArrow`: reusable two-stroke directional annotation.
- `Stamp`: circular or rectangular rough registration stamp.
- `TechnicalGrid`: engineering-grid and measurement-mark texture.
- `HalftoneTexture`: sparse screen-print dot field.

The following compositions and effects in `src/styles.css`, together with their
semantic markup in `src/App.tsx`, are also **not AI-generated**:

- Warm-paper ruled background and the inline SVG fractal-noise toner overlay.
- Browser chrome, sticky tab navigation, loading bar, ticker, scroll cue,
  and cricket scorecard. Pointer behavior is deliberately left to the native
  browser and operating-system cursor.
- Brutalist panels, heavy rules, hard shadows, registration colors, focus
  rings, hover/focus reveals, and section annotations.
- Interest-tab stage and artwork framing.
- Side-quest ticket, empty polaroid/contact sheet, achievement stamp, sports
  card, research abstract, terminal log, and newspaper clipping.
- Character-stat meters, bug reports and controls, Beauty annotation,
  Product-philosophy technical specification, rapid-fire strips, and closing
  marquee.
- Responsive recompositions and reduced-motion overrides.

Lucide interface icons and the three Fontsource typefaces are third-party
library assets, not generated imagery.
