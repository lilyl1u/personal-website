/*
 * Colour tokens: the single source of truth for every colour on the site.
 * They are written to CSS custom properties on <html> at startup
 * (applyPalette, called from main.tsx) and read directly by the canvas code,
 * so changing a value here changes it everywhere.
 *
 * Contrast (WCAG 2.x, checked against `paper`, the main background):
 *   ink 10.6:1 · inkSoft 5.6:1 · sageDeep 5.3:1 (links) · inkSoft on sand 4.8:1
 *   onDark on vinyl 16.4:1 · linen on sageDeep 5.9:1 (button)
 *   linen on earth 4.2:1: only used for the large bold label wordmark (≥3:1).
 */
export const palette = {
  /** Main background: the sleeve and liner notes. */
  paper: '#F1EBDF',
  /** Lighter surface: chips, hover fills, text on dark. */
  linen: '#FAF7F1',
  /** The intro sleeve ribbons: a step darker than paper so the spiral reads. */
  sand: '#E4DACA',
  /** Hairlines and dividers. */
  line: '#D2C6B2',
  /** Primary text. */
  ink: '#3A322A',
  /** Secondary text. */
  inkSoft: '#675B4D',
  /** Centre label of the record. */
  earth: '#8A7356',
  /** Paper label printed on the record, faintly green. */
  labelPaper: '#DCDCC6',
  /** Green accents: decorative details. */
  sage: '#9CA88A',
  /** Green accents: links, buttons and small text that must stay readable. */
  sageDeep: '#56654A',
  /** The vinyl itself and the table it sits on. */
  vinyl: '#1C1915',
  deck: '#D8CEBC',
  /** Text over the dark record. */
  onDark: '#FAF7F1',
  onDarkSoft: '#DCD3C3',
} as const;

const toVar = (k: string) => '--' + k.replace(/[A-Z]/g, c => '-' + c.toLowerCase());

export function applyPalette(root: HTMLElement = document.documentElement) {
  for (const [k, v] of Object.entries(palette)) root.style.setProperty(toVar(k), v);
}
