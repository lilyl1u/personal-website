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

export function createRibbons(canvas: HTMLCanvasElement) {
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
    g.fillStyle = palette.clay;
    g.fillRect(0, 0, W, H);

    // Soft vignette so the sleeve reads as a printed surface, not flat UI.
    const v = g.createRadialGradient(cx, cy, labelR, cx, cy, Math.hypot(W, H) / 2);
    v.addColorStop(0, 'rgba(244,239,230,0.05)');
    v.addColorStop(1, 'rgba(20,14,8,0.22)');
    g.fillStyle = v;
    g.fillRect(0, 0, W, H);

    g.strokeStyle = 'rgba(30,22,14,0.16)';
    g.lineWidth = 0.6;
    const maxR = Math.hypot(W, H) / 2 + band;
    for (let r = labelR + 4; r < maxR; r += 5) {
      g.beginPath();
      g.arc(cx, cy, r, 0, Math.PI * 2);
      g.stroke();
    }

    // Fine seam along each ribbon's outer edge, so the coils read as ribbons.
    g.strokeStyle = 'rgba(28,20,12,0.38)';
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
      g.fillStyle = rnd() > 0.55 ? 'rgba(244,239,230,0.05)' : 'rgba(24,16,8,0.08)';
      g.fillRect(rnd() * W, rnd() * H, 0.8, 0.8);
    }
    texture = t;
  }

  function resize(w: number, h: number, labelR: number, mobile: boolean) {
    W = w; H = h; cx = w / 2; cy = h / 2;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
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
  }

  function drawTab(s: Sample, dir: number) {
    // Centreline point, tangent (direction of increasing theta) and normal.
    const x = cx + s.r * Math.cos(s.a), y = cy + s.r * Math.sin(s.a);
    const tx = b * Math.cos(s.a) - s.r * Math.sin(s.a), ty = b * Math.sin(s.a) + s.r * Math.cos(s.a);
    const L = Math.hypot(tx, ty) || 1;
    const ang = Math.atan2(ty / L, tx / L);
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(ang);
    const wTab = band * 0.62, len = tabLen;
    // Shadow edge where the ribbon has been cut.
    ctx.fillStyle = 'rgba(16,10,4,0.28)';
    ctx.fillRect(-1, -band / 2, 4, band);
    ctx.fillStyle = palette.putty;
    ctx.strokeStyle = 'rgba(40,30,18,0.55)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(-len * dir, -wTab / 2, len + 2, wTab, [len * 0.55, 2, 2, len * 0.55]);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = 'rgba(91,76,58,0.55)';
    for (let i = 0; i < 3; i++) {
      const gx = -len * 0.25 - i * len * 0.18;
      ctx.beginPath();
      ctx.moveTo(gx, -wTab * 0.24);
      ctx.lineTo(gx, wTab * 0.24);
      ctx.stroke();
    }
    ctx.restore();
  }

  /** p is intro progress in [0, 1]. Returns false once nothing is left to draw. */
  function render(p: number) {
    const q = clamp(p);
    if (q === last) return q < 1;
    last = q;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    if (q >= 1 || !texture) return false;

    const tail = endDistance * travel(q);
    const path = new Path2D();
    const tails: Sample[] = [];
    for (const arm of arms) {
      const s0 = sampleAt(arm, tail);
      tails.push(s0);
      const i0 = indexAfter(arm, tail);
      const [ox, oy] = edge(s0, 1);
      path.moveTo(ox, oy);
      for (let i = i0; i < arm.length; i++) {
        const [x, y] = edge(arm[i], 1);
        path.lineTo(x, y);
      }
      for (let i = arm.length - 1; i >= i0; i--) {
        const [x, y] = edge(arm[i], -1);
        path.lineTo(x, y);
      }
      const [ix, iy] = edge(s0, -1);
      path.lineTo(ix, iy);
      path.closePath();
    }
    ctx.save();
    ctx.clip(path);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(texture, 0, 0);
    ctx.restore();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (q > 0) for (const s of tails) drawTab(s, 1);
    return true;
  }

  return { resize, render };
}
