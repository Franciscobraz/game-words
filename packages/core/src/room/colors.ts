/** Background of the TV screen. Player colors are judged against it. */
export const TV_BACKGROUND = '#121417';

/** Minimum WCAG 2.x contrast ratio of a player color on the TV background (graphics minimum). */
export const MIN_CONTRAST = 3;

/** Minimum CIEDE2000 distance between the colors of two players. */
export const MIN_COLOR_DISTANCE = 20;

export interface Rgb {
  /** 0-255 */
  r: number;
  g: number;
  b: number;
}

export interface Lab {
  L: number;
  a: number;
  b: number;
}

export type ColorError = 'bad-color' | 'color-illegible' | 'color-too-similar';

const HEX_RE = /^#[0-9a-fA-F]{6}$/;

/** Parses `#RRGGBB` (either case). Returns null for anything else. */
export function parseHex(s: string): Rgb | null {
  if (!HEX_RE.test(s)) return null;
  const n = Number.parseInt(s.slice(1), 16);
  return { r: (n >> 16) & 0xff, g: (n >> 8) & 0xff, b: n & 0xff };
}

function toRgb(color: string | Rgb): Rgb {
  if (typeof color !== 'string') return color;
  const rgb = parseHex(color);
  if (!rgb) throw new Error(`Invalid color "${color}": expected #RRGGBB`);
  return rgb;
}

/** sRGB channel (0-255) to linear light (0-1). */
function linear(channel: number): number {
  const c = channel / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

/** WCAG 2.x relative luminance. */
export function relativeLuminance(color: string | Rgb): number {
  const { r, g, b } = toRgb(color);
  return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
}

/** WCAG 2.x contrast ratio, from 1 to 21. */
export function contrastRatio(a: string | Rgb, b: string | Rgb): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

// D65 reference white, Y = 1.
const WHITE = { x: 0.95047, y: 1, z: 1.08883 };

/** sRGB to CIELAB (D65). */
export function toLab(color: string | Rgb): Lab {
  const { r, g, b } = toRgb(color);
  const R = linear(r);
  const G = linear(g);
  const B = linear(b);
  const x = 0.4124564 * R + 0.3575761 * G + 0.1804375 * B;
  const y = 0.2126729 * R + 0.7151522 * G + 0.072175 * B;
  const z = 0.0193339 * R + 0.119192 * G + 0.9503041 * B;
  const f = (t: number) => (t > 216 / 24389 ? Math.cbrt(t) : ((24389 / 27) * t + 16) / 116);
  const fx = f(x / WHITE.x);
  const fy = f(y / WHITE.y);
  const fz = f(z / WHITE.z);
  return { L: 116 * fy - 16, a: 500 * (fx - fy), b: 200 * (fy - fz) };
}

const DEG = Math.PI / 180;

/** Hue angle in degrees, 0-360; 0 when a and b are both 0. */
function hue(b: number, a: number): number {
  if (a === 0 && b === 0) return 0;
  const h = Math.atan2(b, a) / DEG;
  return h < 0 ? h + 360 : h;
}

/** CIEDE2000 color difference (kL = kC = kH = 1), per Sharma, Wu and Dalal (2005). */
export function ciede2000(x: string | Rgb | Lab, y: string | Rgb | Lab): number {
  const p = typeof x === 'string' || 'r' in x ? toLab(x) : x;
  const q = typeof y === 'string' || 'r' in y ? toLab(y) : y;

  const C1 = Math.hypot(p.a, p.b);
  const C2 = Math.hypot(q.a, q.b);
  const Cbar7 = ((C1 + C2) / 2) ** 7;
  const G = 0.5 * (1 - Math.sqrt(Cbar7 / (Cbar7 + 25 ** 7)));
  const a1 = (1 + G) * p.a;
  const a2 = (1 + G) * q.a;
  const c1 = Math.hypot(a1, p.b);
  const c2 = Math.hypot(a2, q.b);
  const h1 = hue(p.b, a1);
  const h2 = hue(q.b, a2);

  const dL = q.L - p.L;
  const dC = c2 - c1;
  let dh = 0;
  if (c1 * c2 !== 0) {
    dh = h2 - h1;
    if (dh > 180) dh -= 360;
    else if (dh < -180) dh += 360;
  }
  const dH = 2 * Math.sqrt(c1 * c2) * Math.sin((dh / 2) * DEG);

  const Lbar = (p.L + q.L) / 2;
  const cbar = (c1 + c2) / 2;
  let hbar = h1 + h2;
  if (c1 * c2 !== 0) {
    if (Math.abs(h1 - h2) <= 180) hbar = (h1 + h2) / 2;
    else hbar = h1 + h2 < 360 ? (h1 + h2 + 360) / 2 : (h1 + h2 - 360) / 2;
  }

  const T =
    1 -
    0.17 * Math.cos((hbar - 30) * DEG) +
    0.24 * Math.cos(2 * hbar * DEG) +
    0.32 * Math.cos((3 * hbar + 6) * DEG) -
    0.2 * Math.cos((4 * hbar - 63) * DEG);
  const dTheta = 30 * Math.exp(-(((hbar - 275) / 25) ** 2));
  const cbar7 = cbar ** 7;
  const Rc = 2 * Math.sqrt(cbar7 / (cbar7 + 25 ** 7));
  const Sl = 1 + (0.015 * (Lbar - 50) ** 2) / Math.sqrt(20 + (Lbar - 50) ** 2);
  const Sc = 1 + 0.045 * cbar;
  const Sh = 1 + 0.015 * cbar * T;
  const Rt = -Math.sin(2 * dTheta * DEG) * Rc;

  const l = dL / Sl;
  const c = dC / Sc;
  const h = dH / Sh;
  return Math.sqrt(l * l + c * c + h * h + Rt * c * h);
}

/** Whether a contrast ratio is enough for a player color on the TV. */
export function meetsContrast(ratio: number): boolean {
  return ratio >= MIN_CONTRAST;
}

/** Whether a CIEDE2000 distance keeps two player colors apart. */
export function meetsDistance(distance: number): boolean {
  return distance >= MIN_COLOR_DISTANCE;
}

/**
 * Checks a player color, in order: the `#RRGGBB` format, the contrast on
 * `TV_BACKGROUND`, and the distance to the colors of the other players.
 * Returns null when the color is accepted.
 */
export function checkColor(color: string, others: readonly string[]): ColorError | null {
  if (!parseHex(color)) return 'bad-color';
  if (!meetsContrast(contrastRatio(color, TV_BACKGROUND))) return 'color-illegible';
  if (others.some((other) => !meetsDistance(ciede2000(color, other)))) return 'color-too-similar';
  return null;
}

/** Ten suggested player colors, each legible on the TV and at least 20 apart from the others. */
export const PALETTE: readonly string[] = [
  '#E53935',
  '#FB8C00',
  '#FDD835',
  '#43A047',
  '#00ACC1',
  '#1E88E5',
  '#9575CD',
  '#F06292',
  '#8D6E63',
  '#FFFFFF',
];
