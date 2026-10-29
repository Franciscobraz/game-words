/// <reference types="node" />
// The audit reads the stylesheets from disk: Vitest hands `.css` imports over empty, even with `?raw`.
import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, test } from 'vitest';

/**
 * A static audit of every stylesheet of the phone (UI-01 AC 2-4, 8; AD-010, AD-016,
 * AD-017). Each rule is a function that lists the violations of one CSS text; the
 * proof cases show that each one catches a bad sample, then the package's CSS must
 * have none.
 */

/** Every `.css` file of `src/styles/`, by file name. */
const PACKAGE_CSS = readStylesheets(new URL('.', import.meta.url));

function readStylesheets(dir: URL): Record<string, string> {
  const sheets: Record<string, string> = {};
  for (const name of readdirSync(dir).filter((file) => file.endsWith('.css'))) sheets[name] = readFileSync(new URL(name, dir), 'utf8');
  return sheets;
}

/** The largest px size a width or height may use: icons, borders, avatars, the 48 px target (AD-016). */
const MAX_PX_DETAIL = 64;

/** Properties that size a box. */
const SIZE_PROPERTIES = new Set(['width', 'height', 'min-width', 'min-height', 'max-width', 'max-height', 'flex-basis']);

/** The only properties an animation or transition may move (UI-01 AC 4). */
const ANIMATABLE = new Set(['transform', 'opacity']);

/** Color keywords that carry no color of their own. */
const COLOR_KEYWORDS_ALLOWED = new Set(['transparent', 'currentcolor', 'inherit', 'initial', 'unset', 'none']);

/** CSS named colors a stylesheet could write instead of a theme variable (the common ones). */
const NAMED_COLORS = [
  'white',
  'black',
  'red',
  'green',
  'blue',
  'yellow',
  'orange',
  'purple',
  'pink',
  'gray',
  'grey',
  'gold',
  'silver',
  'navy',
  'teal',
  'cyan',
  'magenta',
  'lime',
  'maroon',
  'olive',
  'brown',
];

interface Declaration {
  property: string;
  value: string;
}

/** The CSS without comments. */
function stripComments(css: string): string {
  return css.replace(/\/\*[\s\S]*?\*\//g, '');
}

/** Every `property: value` of the CSS, at any depth. */
function declarations(css: string): Declaration[] {
  const found: Declaration[] = [];
  for (const match of stripComments(css).matchAll(/([a-z-]+)\s*:\s*([^;{}]+)(?=;|})/gi)) {
    found.push({ property: match[1]!.toLowerCase(), value: match[2]!.trim() });
  }
  return found;
}

/** The body of each `@keyframes` block. */
function keyframeBodies(css: string): string[] {
  const text = stripComments(css);
  const bodies: string[] = [];
  for (const match of text.matchAll(/@keyframes\s+[\w-]+\s*\{/g)) {
    const start = match.index + match[0].length;
    let depth = 1;
    let end = start;
    while (end < text.length && depth > 0) {
      if (text[end] === '{') depth += 1;
      if (text[end] === '}') depth -= 1;
      end += 1;
    }
    bodies.push(text.slice(start, end - 1));
  }
  return bodies;
}

/** CSS Grid and `gap` (UI-01 AC 3; the TV-class browsers of DESIGN §4.5). */
function gridAndGap(css: string): string[] {
  return declarations(css)
    .filter((d) => /^(display)$/.test(d.property) ? /\b(inline-)?grid\b/.test(d.value) : /^(grid(-.*)?|gap|row-gap|column-gap)$/.test(d.property))
    .map((d) => `${d.property}: ${d.value}`);
}

/** Blur, backdrop filters, and transitions or keyframes of anything but transform and opacity (UI-01 AC 4). */
function heavyAnimation(css: string): string[] {
  const problems: string[] = [];
  for (const d of declarations(css)) {
    if (d.property.includes('backdrop-filter')) problems.push(`${d.property}: ${d.value}`);
    if (/\bblur\(/.test(d.value)) problems.push(`${d.property}: ${d.value}`);
    if (d.property === 'transition' || d.property === 'transition-property') {
      for (const moved of transitionProperties(d)) if (!ANIMATABLE.has(moved)) problems.push(`${d.property}: ${d.value}`);
    }
  }
  for (const body of keyframeBodies(css)) {
    for (const d of declarations(body)) if (!ANIMATABLE.has(d.property)) problems.push(`@keyframes ${d.property}`);
  }
  return problems;
}

/** The property each part of a `transition` moves; `all` counts as moving everything. */
function transitionProperties(d: Declaration): string[] {
  return d.value.split(',').map((part) => part.trim().split(/\s+/)[0]!.toLowerCase());
}

/** Literal colors: hex, rgb(), hsl() and named colors; only theme variables may carry a color (UI-01 AC 2, AD-017). */
function literalColors(css: string): string[] {
  const problems: string[] = [];
  for (const d of declarations(css)) {
    if (d.property.startsWith('--')) continue;
    const value = d.value.toLowerCase();
    if (/#[0-9a-f]{3,8}\b/.test(value) || /\b(rgba?|hsla?|hwb|lab|lch|oklab|oklch)\(/.test(value)) {
      problems.push(`${d.property}: ${d.value}`);
      continue;
    }
    const words = value.match(/[a-z-]+/g) ?? [];
    if (words.some((word) => NAMED_COLORS.includes(word) && !COLOR_KEYWORDS_ALLOWED.has(word))) problems.push(`${d.property}: ${d.value}`);
  }
  return problems;
}

/** Widths and heights in px above 64 px; containers size with relative units (UI-01 AC 8, AD-016). */
function largePixelSizes(css: string): string[] {
  const problems: string[] = [];
  for (const d of declarations(css)) {
    if (!SIZE_PROPERTIES.has(d.property)) continue;
    for (const match of d.value.matchAll(/(-?\d*\.?\d+)px\b/g)) {
      if (Math.abs(Number(match[1])) > MAX_PX_DETAIL) problems.push(`${d.property}: ${d.value}`);
    }
  }
  return problems;
}

/** The violations of `rule` in every stylesheet of the package, by file. */
function packageViolations(rule: (css: string) => string[]): Record<string, string[]> {
  const report: Record<string, string[]> = {};
  for (const [path, css] of Object.entries(PACKAGE_CSS)) {
    const problems = rule(css);
    if (problems.length > 0) report[path] = problems;
  }
  return report;
}

test('finds the package stylesheets', () => {
  expect(Object.keys(PACKAGE_CSS).length).toBeGreaterThan(40);
  expect(PACKAGE_CSS['board-grid.css']).toContain('.board-grid--locked');
});

describe('UI-01 AC 3', () => {
  test('uses no CSS grid and no gap', () => {
    expect(packageViolations(gridAndGap)).toEqual({});
  });

  test('catches grid and gap in a sample', () => {
    expect(gridAndGap('.a { display: grid; }')).toHaveLength(1);
    expect(gridAndGap('.a { display: inline-grid; }')).toHaveLength(1);
    expect(gridAndGap('.a { grid-template-columns: 1fr 1fr; }')).toHaveLength(1);
    expect(gridAndGap('.a { gap: 8px; }')).toHaveLength(1);
    expect(gridAndGap('.a { row-gap: 8px; column-gap: 4px; }')).toHaveLength(2);
    expect(gridAndGap('.a { display: flex; margin-top: 8px; } /* display: grid */')).toEqual([]);
  });
});

describe('UI-01 AC 4', () => {
  test('animates only transform and opacity, with no blur', () => {
    expect(packageViolations(heavyAnimation)).toEqual({});
  });

  test('catches blur, backdrop filters and heavy animations in a sample', () => {
    expect(heavyAnimation('.a { filter: blur(4px); }')).toHaveLength(1);
    expect(heavyAnimation('.a { backdrop-filter: saturate(2); }')).toHaveLength(1);
    expect(heavyAnimation('.a { -webkit-backdrop-filter: none; }')).toHaveLength(1);
    expect(heavyAnimation('.a { transition: width 200ms; }')).toHaveLength(1);
    expect(heavyAnimation('.a { transition: all 200ms; }')).toHaveLength(1);
    expect(heavyAnimation('.a { transition-property: box-shadow; }')).toHaveLength(1);
    expect(heavyAnimation('@keyframes grow { from { width: 0; } to { width: 10%; } }')).toHaveLength(2);
    expect(heavyAnimation('@keyframes glow { to { box-shadow: 0 0 4px var(--color-primary); } }')).toHaveLength(1);
    expect(
      heavyAnimation('.a { transition: transform 200ms, opacity 100ms; } @keyframes in { from { opacity: 0; transform: scale(0.9); } }'),
    ).toEqual([]);
  });
});

describe('UI-01 AC 2 (AD-017)', () => {
  test('uses only theme variables for colors', () => {
    expect(packageViolations(literalColors)).toEqual({});
  });

  test('catches literal colors in a sample', () => {
    expect(literalColors('.a { color: #fff; }')).toHaveLength(1);
    expect(literalColors('.a { background: #12131a80; }')).toHaveLength(1);
    expect(literalColors('.a { color: rgb(255 0 0); }')).toHaveLength(1);
    expect(literalColors('.a { border-color: rgba(0, 0, 0, 0.5); }')).toHaveLength(1);
    expect(literalColors('.a { color: hsl(0 100% 50%); }')).toHaveLength(1);
    expect(literalColors('.a { color: white; }')).toHaveLength(1);
    expect(literalColors('.a { border: 1px solid black; }')).toHaveLength(1);
    expect(
      literalColors(
        '.a { color: var(--color-primary); background: color-mix(in srgb, var(--color-valid) 20%, transparent); fill: currentColor; }',
      ),
    ).toEqual([]);
  });
});

describe('UI-01 AC 8 (AD-016)', () => {
  test('sizes containers only with relative units', () => {
    expect(packageViolations(largePixelSizes)).toEqual({});
  });

  test('catches px sizes above 64 px in a sample', () => {
    expect(largePixelSizes('.a { width: 390px; }')).toHaveLength(1);
    expect(largePixelSizes('.a { max-width: 65px; }')).toHaveLength(1);
    expect(largePixelSizes('.a { min-height: calc(100% - 120px); }')).toHaveLength(1);
    expect(largePixelSizes('.a { flex-basis: 200px; }')).toHaveLength(1);
    expect(largePixelSizes('.a { width: 64px; height: 48px; min-width: min(90%, 40rem); }')).toEqual([]);
  });
});
