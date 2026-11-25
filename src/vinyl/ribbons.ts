import { palette } from './palette';

/*
 * The intro "sleeve": two interleaved Archimedean spiral ribbons that tile the
 * whole screen outside the centre label. Scrolling pulls them away from the
 * inner end outward, uncovering the record underneath.
 *
 * Everything static (colour, grain, grooves, seams) is painted once per resize
 * into an offscreen texture. Each frame only rebuilds one path from the
 * current tail position and blits the texture through it as a clip.
 */

type Sample = { r: number; a: number; d: number };

const clamp = (v: number, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, v));

/** Linear travel with short eased ramps at each end. */
function travel(q: number, ramp = 0.06) {
  q = clamp(q);
  const t = q < ramp ? (q * q) / (2 * ramp) : q > 1 - ramp ? 1 - ramp - ((1 - q) * (1 - q)) / (2 * ramp) : q - ramp / 2;
  return t / (1 - ramp);
}

export function createRibbons(canvas: HTMLCanvasElement, tabs: HTMLElement[] = []) {
  const ctx = canvas.getContext('2d')!;
  let W = 0, H = 0, cx = 0, cy = 0, dpr = 1;
  let band = 0, b = 0, phase0 = 0, tabLen = 0;
  let arms: Sample[][] = [];
  let endDistance = 0;
  let texture: HTMLCanvasElement | null = null;
  let last = -1;

  function edge(s: Sample, side: 1 | -1) {
    const r = Math.max(0, s.r + side * (band / 2 + 0.6));
    return [cx + r * Math.cos(s.a), cy + r * Math.sin(s.a)] as const;
  }

  function sampleAt(arm: Sample[], d: number): Sample {
    let lo = 0, hi = arm.length - 1;
    while (hi - lo > 1) {
      const m = (lo + hi) >> 1;
      if (arm[m].d < d) lo = m; else hi = m;
    }
    const A = arm[lo], B = arm[hi];
    const f = B.d === A.d ? 0 : clamp((d - A.d) / (B.d - A.d));
    return { r: A.r + (B.r - A.r) * f, a: A.a + (B.a - A.a) * f, d };
  }

  function indexAfter(arm: Sample[], d: number) {
    let lo = 0, hi = arm.length - 1;
    while (hi - lo > 1) {
      const m = (lo + hi) >> 1;
      if (arm[m].d <= d) lo = m; else hi = m;
    }
    return hi;
  }

  function paintTexture(labelR: number) {
    const t = document.createElement('canvas');
    t.width = Math.round(W * dpr);
    t.height = Math.round(H * dpr);
    const g = t.getContext('2d')!;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.fillStyle = palette.sand;
    g.fillRect(0, 0, W, H);

    // Soft vignette so the sleeve reads as a printed surface, not flat UI.
    const v = g.createRadialGradient(cx, cy, labelR, cx, cy, Math.hypot(W, H) / 2);
    v.addColorStop(0, 'rgba(250,247,241,0.35)');
    v.addColorStop(1, 'rgba(58,50,42,0.10)');
    g.fillStyle = v;
    g.fillRect(0, 0, W, H);

    g.strokeStyle = 'rgba(58,50,42,0.08)';
    g.lineWidth = 0.6;
    const maxR = Math.hypot(W, H) / 2 + band;
    for (let r = labelR + 4; r < maxR; r += 5) {
      g.beginPath();
      g.arc(cx, cy, r, 0, Math.PI * 2);
      g.stroke();
    }

    // Fine seam along each ribbon's outer edge, so the coils read as ribbons.
    g.strokeStyle = 'rgba(86,101,74,0.30)';
    g.lineWidth = 1.1;
    for (const arm of arms) {
      g.beginPath();
      arm.forEach((s, i) => {
        const [x, y] = edge(s, 1);
        if (i === 0) g.moveTo(x, y); else g.lineTo(x, y);
      });
      g.stroke();
    }

    let seed = 2027;
    const rnd = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296);
    const count = Math.round((W * H) / 55);
    for (let i = 0; i < count; i++) {
      g.fillStyle = rnd() > 0.55 ? 'rgba(250,247,241,0.35)' : 'rgba(58,50,42,0.06)';
      g.fillRect(rnd() * W, rnd() * H, 0.8, 0.8);
    }
    texture = t;
  }

  function resize(w: number, h: number, labelR: number, mobile: boolean) {
    W = w; H = h; cx = w / 2; cy = h / 2;
    // The sleeve is soft and grainy; 1.25x is indistinguishable from 2x here and
    // composites under 40% of the pixels on retina screens.
    dpr = Math.min(window.devicePixelRatio || 1, 1.25);
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);

    band = mobile ? clamp(Math.min(w, h) * 0.12, 40, 56) : clamp(Math.min(w, h) * 0.1, 64, 108);
    // Two arms offset by half a turn, each one band wide, tile the plane.
    b = band / Math.PI;
    tabLen = band * 0.42;
    phase0 = -Math.PI * 0.62;
    // The inner end starts tucked under the label so every pixel outside it is covered.
    const rStart = labelR - band / 2;
    const half = Math.hypot(w, h) / 2;
    const thetaMax = (half + band * 2 - rStart) / b;
    arms = [0, 1].map(k => {
      const out: Sample[] = [];
      let d = 0, px = 0, py = 0, th = 0;
      // Roughly constant ~5px segments: fewer vertices near the centre and a
      // much lighter path to rebuild each frame than a fixed angular step.
      while (true) {
        const r = rStart + b * th;
        const a = phase0 + k * Math.PI + th;
        const x = r * Math.cos(a), y = r * Math.sin(a);
        if (out.length) d += Math.hypot(x - px, y - py);
        px = x; py = y;
        out.push({ r, a, d });
        if (th >= thetaMax) break;
        th = Math.min(thetaMax, th + Math.min(0.05, 5 / Math.max(1, Math.abs(r))));
      }
      return out;
    });

    // Stop as soon as the inner edge (plus the pull tab) has left the screen.
    const thetaEnd = (half + band / 2 + tabLen + 4 - rStart) / b;
    const endR = rStart + b * Math.min(thetaEnd, thetaMax);
    endDistance = arms[0].find(sm => sm.r >= endR)?.d ?? arms[0][arms[0].length - 1].d;
    paintTexture(labelR);
    last = -1;
    drawnTail = -1;
  }

  /** Ribbon polygon for one arm between two distances along it. */
  function strip(path: Path2D, arm: Sample[], d0: number, d1: number, grow: number) {
    const e = (sm: Sample, side: 1 | -1) => {
      const r = Math.max(0, sm.r + side * (band / 2 + grow));
      return [cx + r * Math.cos(sm.a), cy + r * Math.sin(sm.a)] as const;
    };
    const s0 = sampleAt(arm, d0), s1 = sampleAt(arm, d1);
    const i0 = indexAfter(arm, d0), i1 = indexAfter(arm, d1);
    path.moveTo(...e(s0, 1));
    for (let i = i0; i < i1; i++) path.lineTo(...e(arm[i], 1));
    path.lineTo(...e(s1, 1));
    path.lineTo(...e(s1, -1));
    for (let i = i1 - 1; i >= i0; i--) path.lineTo(...e(arm[i], -1));
    path.lineTo(...e(s0, -1));
    path.closePath();
  }

  function placeTabs(tail: number, visible: boolean) {
    arms.forEach((arm, k) => {
      const el = tabs[k];
      if (!el) return;
      if (!visible) { el.style.visibility = 'hidden'; return; }
      const sm = sampleAt(arm, tail);
      const x = cx + sm.r * Math.cos(sm.a), y = cy + sm.r * Math.sin(sm.a);
      const tx = b * Math.cos(sm.a) - sm.r * Math.sin(sm.a), ty = b * Math.sin(sm.a) + sm.r * Math.cos(sm.a);
      const ang = Math.atan2(ty, tx);
      el.style.visibility = 'visible';
      el.style.transform = `translate3d(${x.toFixed(2)}px,${y.toFixed(2)}px,0) rotate(${ang.toFixed(4)}rad)`;
    });
  }

  /*
   * The canvas is only ever repainted in full on resize. After that each frame
   * touches just the thin strip between the previous and the new tail: erased
   * when scrolling forward, re-filled from the texture when scrolling back.
   * That keeps per-frame raster work proportional to how far the tail moved,
   * not to the size of the screen times devicePixelRatio².
   */
  let drawnTail = -1;

  function paintFrom(tail: number) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalCompositeOperation = 'source-over';
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const path = new Path2D();
    for (const arm of arms) strip(path, arm, tail, arm[arm.length - 1].d, 0.6);
    ctx.save();
    ctx.clip(path);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(texture!, 0, 0);
    ctx.restore();
    drawnTail = tail;
  }

  /** p is intro progress in [0, 1]. Returns false once nothing is left to draw. */
  function render(p: number) {
    const q = clamp(p);
    if (q === last) return q < 1;
    last = q;
    if (!texture) return false;
    const tail = endDistance * travel(q);
    placeTabs(tail, q > 0 && q < 1);
    if (drawnTail < 0) paintFrom(tail);
    else if (tail > drawnTail) {
      // Overlap the previous cut by a couple of px so antialiased edges never leave a seam.
      const path = new Path2D();
      for (const arm of arms) strip(path, arm, Math.max(0, drawnTail - 2), tail, 0.6);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fill(path);
      ctx.globalCompositeOperation = 'source-over';
      drawnTail = tail;
    } else if (tail < drawnTail) {
      const path = new Path2D();
      for (const arm of arms) strip(path, arm, tail, drawnTail + 2, 0.6);
      ctx.save();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clip(path);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.drawImage(texture, 0, 0);
      ctx.restore();
      drawnTail = tail;
    }
    return q < 1;
  }

  return { resize, render, metrics: () => ({ band, tabLen }) };
}
