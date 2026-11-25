import { palette } from './palette';

/**
 * Paints the vinyl (grooves, track gaps, rim, light sheen) once into a canvas.
 * Everything here is radially symmetric or meant to stay still, so the canvas
 * is never rotated: it is one static texture that is only moved and scaled.
 */
export function paintDisc(canvas: HTMLCanvasElement, cssSize: number) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  // Cap the backing store: a 2048px texture is plenty and keeps GPU memory sane.
  const S = Math.min(2048, Math.round(cssSize * dpr));
  canvas.width = canvas.height = S;
  const g = canvas.getContext('2d')!;
  const c = S / 2;
  g.clearRect(0, 0, S, S);

  g.fillStyle = palette.vinyl;
  g.beginPath();
  g.arc(c, c, c, 0, Math.PI * 2);
  g.fill();

  let seed = 33;
  const rnd = () => ((seed = (Math.imul(seed, 1103515245) + 12345) >>> 0) / 4294967296);
  const inner = c * 0.3, outer = c * 0.965;
  const gaps = [0.44, 0.56, 0.67, 0.79, 0.88].map(f => c * f);
  const step = Math.max(1.2, S / 1400);

  for (let r = inner; r < outer; r += step) {
    const nearGap = gaps.some(gr => Math.abs(gr - r) < S * 0.004);
    const light = rnd() > 0.5;
    const a = nearGap ? 0.02 : 0.03 + rnd() * 0.06;
    g.strokeStyle = light ? `rgba(244,239,230,${a})` : `rgba(0,0,0,${a * 2})`;
    g.lineWidth = step * 0.6;
    g.beginPath();
    g.arc(c, c, r, 0, Math.PI * 2);
    g.stroke();
  }

  // Track gaps: a slightly glossier, smoother ring between songs.
  for (const gr of gaps) {
    g.strokeStyle = 'rgba(244,239,230,0.07)';
    g.lineWidth = S * 0.005;
    g.beginPath();
    g.arc(c, c, gr, 0, Math.PI * 2);
    g.stroke();
  }

  // Run-out groove near the label and a smooth lead-in at the edge.
  g.strokeStyle = 'rgba(244,239,230,0.05)';
  g.lineWidth = S * 0.012;
  g.beginPath();
  g.arc(c, c, c * 0.24, 0, Math.PI * 2);
  g.stroke();

  g.strokeStyle = 'rgba(244,239,230,0.12)';
  g.lineWidth = Math.max(2, S * 0.003);
  g.beginPath();
  g.arc(c, c, c * 0.992, 0, Math.PI * 2);
  g.stroke();

  paintSheen(g, S);
}

function paintSheen(g: CanvasRenderingContext2D, S: number) {
  const c = S / 2;
  g.save();
  g.beginPath();
  g.arc(c, c, c * 0.994, 0, Math.PI * 2);
  g.arc(c, c, c * 0.15, 0, Math.PI * 2, true);
  g.clip();
  if ('createConicGradient' in g) {
    const cg = g.createConicGradient((200 * Math.PI) / 180, c, c);
    const bone = (a: number) => `rgba(244,239,230,${a})`;
    cg.addColorStop(0, bone(0));
    cg.addColorStop(24 / 360, bone(0.075));
    cg.addColorStop(58 / 360, bone(0));
    cg.addColorStop(180 / 360, bone(0));
    cg.addColorStop(206 / 360, bone(0.06));
    cg.addColorStop(240 / 360, bone(0));
    cg.addColorStop(1, bone(0));
    g.fillStyle = cg;
    g.fillRect(0, 0, S, S);
  }
  const rg = g.createRadialGradient(c, c, c * 0.6, c, c, c);
  rg.addColorStop(0, 'rgba(156,168,138,0)');
  rg.addColorStop(0.6, 'rgba(156,168,138,0.10)');
  rg.addColorStop(1, 'rgba(156,168,138,0)');
  g.fillStyle = rg;
  g.fillRect(0, 0, S, S);
  g.restore();
}
