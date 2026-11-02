# ashwin.top

Ashwin Sheoran's personal site: a daylit 3D gallery you walk through by
scrolling. Each part of the page is a station in one long hall, with real-time
reflections, low golden-hour sun through tall windows, and exhibits for the
things Ashwin has built and cares about.

Built with React, TypeScript, Vite, three.js, React Three Fiber, Drei and
pmndrs postprocessing. It is a static site on GitHub Pages: no backend, no
runtime services, no downloaded HDRs or models. Every texture and object in the
scene is generated in code at startup.

## Run it

Requires Node.js 20.19 or newer.

```bash
npm install
npm run dev            # http://127.0.0.1:5173/
npm run check          # lint, type-check, unit tests, production build
npm run build && npm run preview   # http://127.0.0.1:4173/
npm run test:e2e       # Playwright (needs `npx playwright install chromium webkit` once)
```

Useful URL switches while developing:

| Query | Effect |
| --- | --- |
| `?quality=high`, `?quality=medium`, `?quality=low` | Force a rendering tier |
| `?static` | Force the no-WebGL fallback (pre-rendered stills) |
| `?capture` | Camera cuts straight to stations, intro skipped (for screenshots) |
| `?capture=bare` | As above with the page hidden, used to render the fallback stills |

## How the page and the scene fit together

- `src/data/profile.ts` holds every word on the site. Edit content here.
- `src/data/stations.ts` lists the camera stops in order. Each one is bound to
  a DOM element with a matching `data-station` attribute.
- `src/hooks/useStationTracking.ts` turns the native scroll position into a
  continuous station value (with a short hold at each stop while you read).
  Scrolling is never hijacked.
- `src/three/CameraRig.tsx` flies the camera along a centripetal Catmull-Rom
  path through the station keyframes in `src/three/layout.ts`, shifting the
  frame so exhibits sit beside the text instead of under it.
- `src/components/` is the readable layer: semantic HTML sections styled as
  museum wall labels, the global navigation and the loader. All content lives
  in the DOM, so it works for keyboards, screen readers and search engines even
  if the 3D scene never starts.
- `src/three/` is the scene, loaded lazily after the page content renders.

### Scene notes

- Lighting: a low directional sun casts window-shaped shadows (its shadow
  frustum follows the camera and snaps to texels so it does not shimmer), plus
  two re-aimable spotlights that move between exhibits so the light count, and
  therefore the shaders, never change mid-tour.
- Reflections: a planar reflector floor with depth-aware blur, and an
  environment map baked from emissive panels laid out like the hall, so glass,
  brass, chrome and lacquer reflect windows and walls that match the room.
- Glass uses physical transmission (with dispersion on the prism). Lower tiers
  swap it for a cheaper translucent shader.
- Post-processing: ambient occlusion (high tier only, loaded on demand), bloom,
  AgX tone mapping, vignette, grain and SMAA.
- Exhibits far from the camera are hidden so only nearby ones cost anything.

### Quality tiers and fallbacks

`src/three/quality.ts` picks a starting tier from the device (touch or small
screens, Save-Data and software renderers get `low`), and a runtime performance
monitor steps down if the frame rate drops. Device pixel ratio is capped per
tier.

- No WebGL 2, a lost GPU context or a scene error: the page swaps to
  pre-rendered stills of each station (`public/stills/`), cross-fading as you
  scroll. All content and links keep working.
- `prefers-reduced-motion`: no intro, no idle animation, no parallax; the
  camera cuts between stations instead of flying.

## Add a project

Append an entry to `projects` in `src/data/profile.ts`:

```ts
{
  id: "my-app",
  kind: "app",               // "game" or "app"; menus group by kind
  title: "My App",
  navLabel: "My App",
  medium: "Web app",
  url: "https://ashwin.top/my-app/",
  summary: "One or two sentences.",
  details: ["A fact", "Another fact"],
  exhibit: "display-case",   // generic lightbox exhibit
  cover: "projects/my-app.webp", // optional image in public/
}
```

The navigation menu, the projects section, the camera path and the hall
length all extend automatically. An "Apps" group appears in the menu once the
first app exists. The two current games have bespoke exhibits
(`src/three/exhibits/`): the pool table runs a small break-shot simulation and
the wizarding board is rebuilt from the game's own board graph.

## Regenerate the fallback stills

With `npm run build && npm run preview` running, open
`/?capture=bare&quality=high`, call `window.__gallery.go("<station id>")` for
each id in `src/data/stations.ts`, screenshot at 1600×1000 and save as WebP in
`public/stills/` (names use `-` instead of `:`, for example
`project-pool-game.webp`). `public/og-image.jpg` is the home still cropped to
1200×630.

## Deployment

`.github/workflows/deploy-pages.yml` lints, type-checks, runs unit and browser
tests, builds `dist/` and deploys it with GitHub Actions after a push to
`main`. The custom domain and HTTPS are configured on the repository; nothing in
this project changes them.

The games at `/harry-potter/` and `/pool-game/` are separate GitHub Pages
project sites. This site deliberately ships no `404.html`, no redirects and no
client-side routing, so those paths are never intercepted (a browser test
checks the build output for this).

## Assets

- `public/Ashwin-Sheoran-CV.pdf` is the downloadable CV (source:
  `AshwinSheoranCVFilled.pdf`).
- `BG_Video.mp4` is the original hero video from the previous design, kept as a
  source file; the new site does not use it.
- Fonts (Bricolage Grotesque, Newsreader, IBM Plex Mono) are bundled through
  Fontsource; nothing is fetched from font CDNs. The extruded 3D lettering uses
  a glyph subset generated by `scripts/build-3d-font.mjs`.
