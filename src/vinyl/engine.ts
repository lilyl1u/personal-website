import { createRibbons } from './ribbons';
import { paintDisc, paintSheen } from './disc';

/*
 * One requestAnimationFrame loop drives the whole stage from native scroll.
 *
 *   scroll px ──► smoothed position (critically damped, frame-rate independent)
 *                 ├─ intro progress  → spiral ribbons unwind (canvas)
 *                 ├─ slide progress  → record glides aside, sleeve slides in
 *                 └─ scroll velocity → extra spin, like nudging a platter
 *
 * The page itself scrolls natively (no wheel hijacking), so momentum,
 * keyboard, find-in-page and assistive tech all keep working. Every per-frame
 * write is a transform or opacity on an element that owns its own layer, and
 * nothing is read from the DOM inside the loop except window.scrollY.
 */

export type StageElements = {
  root: HTMLElement;
  stage: HTMLElement;
  orbit: HTMLElement;
  spin: HTMLElement;
  disc: HTMLCanvasElement;
  sheen: HTMLCanvasElement;
  ribbons: HTMLCanvasElement;
  badgeOrbit: HTMLElement;
  badge: HTMLElement;
  sleeve: HTMLElement;
  content: HTMLElement;
  rail: HTMLElement;
  heroNote: HTMLElement;
  cue: HTMLElement;
  toggle: HTMLElement;
};

export type Engine = {
  setPlaying(on: boolean): void;
  destroy(): void;
};

const clamp = (v: number, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const smooth = (t: number) => (t = clamp(t)) * t * (3 - 2 * t);
const range = (p: number, a: number, b: number) => smooth((p - a) / (b - a));
/** Gentle in, long soft landing: reads as a heavy platter coming to rest. */
const easeSlide = (t: number) => {
  t = clamp(t);
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
};

const BASE_SPEED = 360 / 9; // deg/s at rest: a calm, readable spin
const MAX_BOOST = 620;

export function createEngine(el: StageElements, onPhase?: (open: boolean) => void): Engine {
  const reducedQuery = matchMedia('(prefers-reduced-motion: reduce)');
  let reduced = reducedQuery.matches;
  const ribbons = createRibbons(el.ribbons);

  let W = 0, H = 0, mobile = false;
  let D0 = 0, R = 0, introLen = 0, slideLen = 0, band = 0, sleeveW = 0;
  let cxF = 0, cyF = 0, sF = 1;
  let toggleSize = 64;

  let S = window.scrollY; // smoothed scroll
  let lastRawY = S, rawVel = 0;
  let angle = 0, badgeAngle = 0, omega = reduced ? 0 : BASE_SPEED, boost = 0;
  let playing = !reduced;
  let raf = 0, lastT = 0;
  let ribbonsLive = true;
  let lastOpen: boolean | null = null;
  const cache = new Map<string, string>();

  function write(node: HTMLElement, prop: 'transform' | 'opacity' | 'clipPath' | 'visibility', value: string, key: string) {
    if (cache.get(key) === value) return;
    cache.set(key, value);
    node.style[prop] = value;
  }

  function measure(force = false) {
    const w = window.innerWidth, h = window.innerHeight;
    // Mobile browsers resize the viewport as the URL bar shows and hides.
    // Ignore those small height-only changes so nothing jumps mid-scroll.
    if (!force && w === W && Math.abs(h - H) < 140) return;
    W = w; H = h;
    mobile = W <= 820 && H > W;
    D0 = Math.ceil(Math.hypot(W, H) * 1.065);
    R = mobile ? Math.min(W * 0.2, H * 0.12) : Math.min(W * 0.095, H * 0.142);
    introLen = reduced ? 0 : H * 1.5;
    slideLen = reduced ? 0 : H * 0.95;
    band = clamp(H * 0.27, 150, 260);
    sleeveW = clamp(W * 0.56, 480, 860);
    toggleSize = mobile ? 52 : 64;

    if (mobile) {
      const Df = W * 1.4;
      sF = Df / D0; cxF = W / 2; cyF = band * 0.42;
    } else {
      const Df = Math.min(H * 1.12, (W - sleeveW) * 2.1);
      sF = Df / D0; cxF = sleeveW + (W - sleeveW) * 0.52; cyF = H / 2;
    }

    const rs = el.root.style;
    rs.setProperty('--vh', `${H}px`);
    rs.setProperty('--disc', `${D0}px`);
    rs.setProperty('--label-r', `${R}px`);
    rs.setProperty('--sticker', `${Math.max(D0 * 0.27, R * 3.4)}px`);
    rs.setProperty('--intro-len', `${introLen}px`);
    rs.setProperty('--slide-len', `${slideLen}px`);
    rs.setProperty('--band', `${band}px`);
    rs.setProperty('--sleeve-w', `${sleeveW}px`);
    el.root.dataset.layout = mobile ? 'mobile' : 'desktop';

    paintDisc(el.disc, D0);
    ribbons.resize(W, H, R, mobile);
    cache.clear();
    ribbonsLive = true;
  }

  function frame(t: number) {
    raf = 0;
    const dt = lastT ? Math.min(0.05, (t - lastT) / 1000) : 1 / 60;
    lastT = t;

    const y = window.scrollY;
    const instVel = (y - lastRawY) / dt;
    lastRawY = y;
    rawVel += (instVel - rawVel) * (1 - Math.exp(-dt * 14));

    // Exponential smoothing toward the real scroll position. Time-based, so it
    // feels the same at 60Hz and 120Hz.
    if (reduced) S = y;
    else {
      S += (y - S) * (1 - Math.exp(-dt * 9));
      if (Math.abs(y - S) < 0.25) S = y;
    }

    const pI = introLen ? clamp(S / introLen) : 1;
    const pS = slideLen ? clamp((S - introLen) / slideLen) : 1;
    const e = easeSlide(pS);

    // Record: glide from full-bleed centre to its resting place beside the sleeve.
    const x = lerp(W / 2, cxF, e) - W / 2;
    const yy = lerp(H / 2, cyF, e) - H / 2;
    const s = lerp(1, sF, e);
    const orbitT = `translate3d(${x.toFixed(2)}px,${yy.toFixed(2)}px,0) scale(${s.toFixed(5)})`;
    write(el.orbit, 'transform', orbitT, 'orbit');
    write(el.badgeOrbit, 'transform', orbitT, 'badgeOrbit');

    if (mobile) {
      // The content sheet rises natively; the record window shrinks to a band
      // that always ends exactly at the sheet's top edge.
      const sheetTop = introLen + slideLen + band - y;
      const bottom = clamp(sheetTop, band, H);
      write(el.stage, 'clipPath', bottom >= H ? 'none' : `inset(0 0 ${(H - bottom).toFixed(1)}px 0)`, 'clip');
      write(el.sleeve, 'transform', 'none', 'sleeve');
      write(el.content, 'transform', 'none', 'content');
    } else {
      write(el.stage, 'clipPath', 'none', 'clip');
      const sx = `translate3d(${((e - 1) * (sleeveW + 24)).toFixed(2)}px,0,0)`;
      write(el.sleeve, 'transform', sx, 'sleeve');
      write(el.content, 'transform', e >= 1 ? 'none' : sx, 'content');
    }

    // Intro canvas only redraws while it is actually changing.
    if (ribbonsLive || pI < 1) ribbonsLive = ribbons.render(reduced ? 1 : pI);
    write(el.ribbons, 'visibility', pI >= 1 || reduced ? 'hidden' : 'visible', 'ribbonsVis');

    const noteO = reduced ? 0 : range(pI, 0.8, 1) * (1 - range(pS, 0, 0.3));
    write(el.heroNote, 'opacity', noteO.toFixed(3), 'note');
    write(el.heroNote, 'transform', `translate3d(0,${((1 - range(pI, 0.8, 1)) * 24 - range(pS, 0, 0.3) * 24).toFixed(2)}px,0)`, 'noteT');
    write(el.heroNote, 'visibility', noteO > 0.01 ? 'visible' : 'hidden', 'noteV');
    write(el.cue, 'opacity', (reduced ? 0 : 1 - range(pI, 0.01, 0.08)).toFixed(3), 'cue');
    write(el.rail, 'opacity', (reduced ? 1 : range(pI, 0.75, 1)).toFixed(3), 'rail');

    // Pause button follows the record's centre (desktop) or tucks into the band (mobile).
    const tx0 = W / 2, ty0 = H - (mobile ? 64 : 74);
    const tx1 = mobile ? W - 40 : cxF, ty1 = mobile ? band - 40 : H - 70;
    const tx = lerp(tx0, tx1, e) - toggleSize / 2, ty = lerp(ty0, ty1, e) - toggleSize / 2;
    write(el.toggle, 'transform', `translate3d(${tx.toFixed(2)}px,${ty.toFixed(2)}px,0)`, 'toggle');

    // Spin: base speed eases up/down like a turntable motor, scroll adds a
    // decaying nudge in the scroll direction.
    const target = playing ? BASE_SPEED : 0;
    omega += (target - omega) * (1 - Math.exp(-dt * (playing ? 1.6 : 2.4)));
    if (!playing && Math.abs(omega) < 0.05) omega = 0;
    const want = reduced ? 0 : clamp(rawVel * 0.32, -MAX_BOOST, MAX_BOOST) * (playing ? 1 : 0.6);
    boost += (want - boost) * (1 - Math.exp(-dt * (Math.abs(want) > Math.abs(boost) ? 8 : 2.2)));
    if (Math.abs(boost) < 0.05 && want === 0) boost = 0;
    const speed = omega + boost;
    angle = (angle + speed * dt) % 360;
    write(el.spin, 'transform', `rotate(${angle.toFixed(3)}deg)`, 'spin');

    // The centre label stays upright under the sleeve, then joins the spin.
    const open = pI >= 0.999;
    if (open) badgeAngle = (badgeAngle + speed * dt) % 360;
    else {
      const to = Math.round(badgeAngle / 360) * 360;
      badgeAngle += (to - badgeAngle) * (1 - Math.exp(-dt * 7));
      if (Math.abs(to - badgeAngle) < 0.05) badgeAngle = 0;
    }
    write(el.badge, 'transform', `rotate(${badgeAngle.toFixed(3)}deg)`, 'badge');

    if (open !== lastOpen) {
      lastOpen = open;
      onPhase?.(open);
    }

    const settling = Math.abs(y - S) > 0.25 || Math.abs(rawVel) > 1 || boost !== 0;
    const spinning = omega !== 0 || (open ? false : Math.abs(badgeAngle) > 0.05);
    if (!document.hidden && (settling || spinning)) schedule();
    else lastT = 0;
  }

  function schedule() {
    if (!raf && !document.hidden) raf = requestAnimationFrame(frame);
  }

  const onScroll = () => schedule();
  const onResize = () => { measure(); schedule(); };
  const onVisibility = () => { lastT = 0; if (!document.hidden) schedule(); };
  const onReduced = () => {
    reduced = reducedQuery.matches;
    playing = !reduced;
    if (reduced) { omega = 0; boost = 0; }
    measure(true);
    schedule();
  };

  paintSheen(el.sheen);
  measure(true);
  S = window.scrollY;
  lastRawY = S;
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onResize);
  document.addEventListener('visibilitychange', onVisibility);
  reducedQuery.addEventListener('change', onReduced);
  schedule();

  return {
    setPlaying(on) { playing = on; schedule(); },
    destroy() {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', onVisibility);
      reducedQuery.removeEventListener('change', onReduced);
    },
  };
}
