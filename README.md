# ashwin.top

Ashwin Sheoran's personal site: a night match under the floodlights. The site
opens high above a full stadium as the floodlights come on, flies down over the
crowd and into the giant screen, and then a spidercam carries you around the
ground as you scroll. Every part of the story has its own spot on the field,
and the page itself is the broadcast graphics laid over the top.

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

## The tour

| Section | Where the camera goes | What is there |
| --- | --- | --- |
| Home | The giant screen at the north end | Opening flight, floodlights switching on, name on the screen |
| About | Behind the striker's stumps | Stumps with LED bails, a bat, a delivery on a loop |
| Interests | Spidercam over the square, then each fielding position | Field-placement graphics, then candlesticks (cover), dice (mid-wicket), keycaps (long-off), a broadcast camera (fine leg) |
| Statement | Above the bowler's end | Pitch map, most balls on a good length |
| Facts | The boundary boards | The facts scroll on the LED boards |
| Journey | Along the off-side outfield | A broadcast "Manhattan": one bar per release |
| Side quests | The home dugout | One artefact per side quest on the bench |
| Strengths | The giant screen | Player ratings |
| Known issues | Behind the bowler, Hawk-Eye angle | Three ball-tracking paths, one per bug. Not out |
| Projects | Lit stages on the south outfield | The pool table and the wizarding board, each with PLAY GAME |
| Contact | High over the south stand | Thanks for watching, fireworks, CV and LinkedIn |

The score bug in the corner counts the tour in overs: one station a ball, six
balls an over.

## How the page and the scene fit together

- `src/data/profile.ts` holds every word on the site. Edit content here.
- `src/data/stations.ts` lists the camera stops in order. Each one is bound to
  a DOM element with a matching `data-station` attribute.
- `src/hooks/useStationTracking.ts` turns the native scroll position into a
  continuous station value (with a short hold at each stop while you read).
  Scrolling is never hijacked, and nothing is hidden behind a click.
- `src/three/CameraRig.tsx` flies the camera along a centripetal Catmull-Rom
  path through the station keyframes in `src/three/layout.ts`, shifting the
  frame so the subject sits beside the text instead of under it. It also flies
  the opening shot; any scroll, key or tap during it fast-forwards it.
- `src/components/` is the readable layer: semantic HTML styled as broadcast
  graphics, the navigation, the score bug and the loader. All content lives in
  the DOM, so it works for keyboards, screen readers and search engines even if
  the 3D scene never starts.
- `src/three/` is the scene, loaded lazily after the page content renders:
  `stadium/` is the ground, stands, floodlights, screen and boards; `sets/` is
  what belongs to each section; `exhibits/` holds the two game exhibits.

### Scene notes

- Lighting: four floodlight towers. Two act as keys and two as fills; on the
  high tier both keys cast shadows, giving things on the field the double
  shadows of a night match. Their
  shadow frustums follow the camera and snap to texels so edges do not crawl.
- Reflections: an environment map baked from a small model of the bowl (light
  banks, the roof's light ring, the screen, a green floor), so the ball, the
  pool balls, chrome and lacquer pick up believable highlights.
- The crowd is one instanced mesh of tens of thousands of people, animated in
  the vertex shader. Pressing DO NOT CLICK sends a Mexican wave round the
  ground and sets off a light show.
- The giant screen is a canvas per section drawn in broadcast style, wiped in
  through an LED-pixel shader. The perimeter boards and the fascia ribbon
  scroll messages taken from the site's own content.
- Post-processing: ambient occlusion (high tier only, loaded on demand), bloom,
  ACES tone mapping, vignette, grain and SMAA.
- Set-pieces far from the camera's focus are hidden, so only nearby ones cost
  anything to draw.

### Quality tiers and fallbacks

`src/three/quality.ts` picks a starting tier from the device (touch or small
screens, Save-Data and software renderers get `low`), and a runtime performance
monitor steps down if the frame rate drops. Device pixel ratio is capped per
tier; phones get a thinner crowd, no light beams and no post-processing.

- No WebGL 2, a lost GPU context or a scene error: the page swaps to
  pre-rendered stills of each station (`public/stills/`), cross-fading as you
  scroll. All content and links keep working.
- `prefers-reduced-motion`: no opening flight, no idle animation, no parallax,
  no wave or fireworks; the camera cuts between stations instead of flying.

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
  exhibit: "display-case",   // a generic lit totem with the title
}
```

The navigation menu, the projects section, the camera path, the stages on the
outfield and the giant screen all pick it up. An "Apps" group appears in the
menu once the first app exists. The two current games have bespoke exhibits
(`src/three/exhibits/`): the pool table runs a small break-shot simulation and
the wizarding board is rebuilt from the game's own board graph.

## Regenerate the fallback stills

With `npm run build && npm run preview` running, open
`/?capture=bare&quality=medium`, call `window.__gallery.go("<station id>")` for
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
- `BG_Video.mp4` is the original hero video from an earlier design, kept as a
  source file; the site does not use it.
- Fonts (Barlow and Barlow Condensed) are bundled through Fontsource; nothing
  is fetched from font CDNs.
