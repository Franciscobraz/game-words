import { describe, expect, test } from 'vitest';
import {
  checkColor,
  ciede2000,
  contrastRatio,
  type Lab,
  meetsContrast,
  meetsDistance,
  PALETTE,
  parseHex,
  toLab,
  TV_BACKGROUND,
} from './colors.ts';

// Sharma, Wu and Dalal (2005), "The CIEDE2000 color-difference formula", Table 1:
// L1, a1, b1, L2, a2, b2, ΔE00.
const SHARMA: readonly (readonly number[])[] = [
  [50.0, 2.6772, -79.7751, 50.0, 0.0, -82.7485, 2.0425],
  [50.0, 3.1571, -77.2803, 50.0, 0.0, -82.7485, 2.8615],
  [50.0, 2.8361, -74.02, 50.0, 0.0, -82.7485, 3.4412],
  [50.0, -1.3802, -84.2814, 50.0, 0.0, -82.7485, 1.0],
  [50.0, -1.1848, -84.8006, 50.0, 0.0, -82.7485, 1.0],
  [50.0, -0.9009, -85.5211, 50.0, 0.0, -82.7485, 1.0],
  [50.0, 0.0, 0.0, 50.0, -1.0, 2.0, 2.3669],
  [50.0, -1.0, 2.0, 50.0, 0.0, 0.0, 2.3669],
  [50.0, 2.49, -0.001, 50.0, -2.49, 0.0009, 7.1792],
  [50.0, 2.49, -0.001, 50.0, -2.49, 0.001, 7.1792],
  [50.0, 2.49, -0.001, 50.0, -2.49, 0.0011, 7.2195],
  [50.0, 2.49, -0.001, 50.0, -2.49, 0.0012, 7.2195],
  [50.0, -0.001, 2.49, 50.0, 0.0009, -2.49, 4.8045],
  [50.0, -0.001, 2.49, 50.0, 0.001, -2.49, 4.8045],
  [50.0, -0.001, 2.49, 50.0, 0.0011, -2.49, 4.7461],
  [50.0, 2.5, 0.0, 50.0, 0.0, -2.5, 4.3065],
  [50.0, 2.5, 0.0, 73.0, 25.0, -18.0, 27.1492],
  [50.0, 2.5, 0.0, 61.0, -5.0, 29.0, 22.8977],
  [50.0, 2.5, 0.0, 56.0, -27.0, -3.0, 31.903],
  [50.0, 2.5, 0.0, 58.0, 24.0, 15.0, 19.4535],
  [50.0, 2.5, 0.0, 50.0, 3.1736, 0.5854, 1.0],
  [50.0, 2.5, 0.0, 50.0, 3.2972, 0.0, 1.0],
  [50.0, 2.5, 0.0, 50.0, 1.8634, 0.5757, 1.0],
  [50.0, 2.5, 0.0, 50.0, 3.2592, 0.335, 1.0],
  [60.2574, -34.0099, 36.2677, 60.4626, -34.1751, 39.4387, 1.2644],
  [63.0109, -31.0961, -5.8663, 62.8187, -29.7946, -4.0864, 1.263],
  [61.2901, 3.7196, -5.3901, 61.4292, 2.248, -4.962, 1.8731],
  [35.0831, -44.1164, 3.7933, 35.0232, -40.0716, 1.5901, 1.8645],
  [22.7233, 20.0904, -46.694, 23.0331, 14.973, -42.5619, 2.0373],
  [36.4612, 47.858, 18.3852, 36.2715, 50.5065, 21.2231, 1.4146],
  [90.8027, -2.0831, 1.441, 91.1528, -1.6435, 0.0447, 1.4441],
  [90.9257, -0.5406, -0.9208, 88.6381, -0.8985, -0.7239, 1.5381],
  [6.7747, -0.2908, -2.4247, 5.8714, -0.0985, -2.2286, 0.6377],
  [2.0776, 0.0795, -1.135, 0.9033, -0.0636, -0.5514, 0.9082],
];

describe('parseHex', () => {
  test('reads #RRGGBB in either case and nothing else', () => {
    expect(parseHex('#121417')).toEqual({ r: 0x12, g: 0x14, b: 0x17 });
    expect(parseHex('#ffAA00')).toEqual({ r: 255, g: 170, b: 0 });
    for (const bad of ['121417', '#12141', '#1214171', '#fff', '#12141g', ' #121417', 'red', '']) {
      expect(parseHex(bad)).toBeNull();
    }
  });
});

describe('contrastRatio', () => {
  test('matches the WCAG 2.x reference values', () => {
    expect(contrastRatio('#FFFFFF', '#000000')).toBeCloseTo(21, 10);
    expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 10);
    expect(contrastRatio('#767676', '#FFFFFF')).toBeCloseTo(4.54, 2);
    expect(contrastRatio('#123456', '#123456')).toBe(1);
  });
});

describe('ciede2000', () => {
  test.each(SHARMA.map((row, i) => [i + 1, row] as const))('Sharma et al. (2005) pair %i', (_, row) => {
    const [L1, a1, b1, L2, a2, b2, expected] = row as [number, number, number, number, number, number, number];
    const p: Lab = { L: L1, a: a1, b: b1 };
    const q: Lab = { L: L2, a: a2, b: b2 };
    expect(Math.abs(ciede2000(p, q) - expected)).toBeLessThan(0.0001);
    expect(Math.abs(ciede2000(q, p) - expected)).toBeLessThan(0.0001);
  });

  test('converts sRGB hex to CIELAB D65', () => {
    const white = toLab('#FFFFFF');
    expect(white.L).toBeCloseTo(100, 3);
    expect(white.a).toBeCloseTo(0, 3);
    expect(white.b).toBeCloseTo(0, 3);
    const red = toLab('#FF0000');
    expect(red.L).toBeCloseTo(53.24, 2);
    expect(red.a).toBeCloseTo(80.09, 2);
    expect(red.b).toBeCloseTo(67.2, 1);
    expect(ciede2000('#E53935', '#E53935')).toBe(0);
  });
});

describe('checkColor', () => {
  test('rejects a color that is not #RRGGBB', () => {
    expect(checkColor('#12345', [])).toBe('bad-color');
    expect(checkColor('red', [])).toBe('bad-color');
  });

  test('contrast limit: 2.99:1 is illegible and 3:1 is legible', () => {
    expect(meetsContrast(2.99)).toBe(false);
    expect(meetsContrast(3)).toBe(true);
    // The greys on either side of 3:1 on the TV background.
    expect(contrastRatio('#616161', TV_BACKGROUND)).toBeLessThan(3);
    expect(contrastRatio('#626262', TV_BACKGROUND)).toBeGreaterThanOrEqual(3);
    expect(checkColor('#616161', [])).toBe('color-illegible');
    expect(checkColor('#626262', [])).toBeNull();
    expect(checkColor(TV_BACKGROUND, [])).toBe('color-illegible');
  });

  test('distance limit: CIEDE2000 19.99 is too similar and 20 is accepted', () => {
    expect(meetsDistance(19.99)).toBe(false);
    expect(meetsDistance(20)).toBe(true);
    // The closest hex colors on either side of 20 from #E53935, varying green.
    expect(ciede2000('#E53935', '#E57C35')).toBeLessThan(20);
    expect(ciede2000('#E53935', '#E57D35')).toBeGreaterThanOrEqual(20);
    expect(checkColor('#E57C35', ['#E53935'])).toBe('color-too-similar');
    expect(checkColor('#E57D35', ['#E53935'])).toBeNull();
    expect(checkColor('#E57C35', ['#1E88E5', '#E53935'])).toBe('color-too-similar');
  });

  test('checks format, then contrast, then distance', () => {
    expect(checkColor('#000000', ['#000000'])).toBe('color-illegible');
    expect(checkColor('#E53935', ['#E53935'])).toBe('color-too-similar');
    expect(checkColor('#E53935', [])).toBeNull();
  });
});

describe('PALETTE', () => {
  test('palette has 10 legible colors at least 20 apart', () => {
    expect(PALETTE).toHaveLength(10);
    expect(new Set(PALETTE).size).toBe(10);
    for (const color of PALETTE) {
      expect(color).toMatch(/^#[0-9A-F]{6}$/);
      expect(contrastRatio(color, TV_BACKGROUND)).toBeGreaterThanOrEqual(3);
    }
    for (let i = 0; i < PALETTE.length; i++) {
      for (let j = i + 1; j < PALETTE.length; j++) {
        expect(ciede2000(PALETTE[i]!, PALETTE[j]!)).toBeGreaterThanOrEqual(20);
      }
    }
    // Each suggestion passes the join check against all the others.
    for (const color of PALETTE) {
      expect(checkColor(color, PALETTE.filter((c) => c !== color))).toBeNull();
    }
  });
});
