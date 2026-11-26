# Lily Liu — personal website

A one-page portfolio built around a vinyl record. On load, a clay-coloured
sleeve made of two spiral ribbons covers the screen; scrolling pulls the
ribbons away to reveal a spinning record, which then glides aside as the
liner notes (About, Projects, Experience, Skills, Contact) slide in.

Built with Vite, React and TypeScript. The output is a static site (`dist/`)
with no server code, so any static host works.

## Run locally

Requires Node 18 or newer.

```bash
npm install
npm run dev        # http://localhost:5173
```

## Build

```bash
npm run build      # type-checks, then writes the static site to dist/
npm run preview    # serves dist/ locally to check the production build
```

## Edit the content

Everything on the page comes from **`src/content.ts`**. Text wrapped in
`[square brackets]` is a placeholder; it shows on the page with a dotted
underline so it is easy to spot. Two placeholders remain:

- `about.photo`: put an image in `public/` (e.g. `public/lily.jpg`) and set
  `photo: './lily.jpg'`.
- `site.vinylMeaning`: a line about what the record stands for.

## Deploy

Live at **https://lilyl1u.github.io/personal-website/**.

**GitHub Pages** (already set up): `.github/workflows/deploy.yml` builds and
deploys on every push to `main`. The repo's *Settings → Pages → Source* must be
*GitHub Actions*. `vite.config.ts` sets `base: '/personal-website/'` to match
the Pages sub-path; if the repo is renamed, update it.

**Netlify / Vercel / Cloudflare Pages / custom domain** (site at the domain
root): build command `BASE_PATH=/ npm run build`, output directory `dist`.

## How the motion works

- `src/vinyl/engine.ts` runs one `requestAnimationFrame` loop. The page
  scrolls natively; the loop eases a smoothed copy of `scrollY` toward the real
  value (time-based, so it feels the same at 60 Hz and 120 Hz) and derives the
  intro and slide progress from it.
- Per frame it only writes `transform` and `opacity` on elements that have
  their own compositor layer, and skips writes when a value hasn't changed.
  The loop sleeps when nothing is moving.
- The record is painted once into a canvas and only rotated/scaled by CSS.
  Scroll velocity adds a decaying nudge to the spin; the pause button spins it
  down and back up like a turntable motor.
- `src/vinyl/ribbons.ts` paints the sleeve texture once per resize and, during
  the intro, rebuilds a single path from the current tail position.
- Phones held upright (width ≤ 820px and taller than wide): the record slides
  up into a band at the top, then the content sheet rises over it and covers
  it completely as the record fades out; the sections get the full screen
  with sticky tabs, and the spin pauses until you scroll back up.
- `prefers-reduced-motion: reduce`: no intro, no spin, no scroll-linked
  motion; the page opens straight on the liner notes beside a still record.
