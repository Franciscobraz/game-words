/// <reference types="node" />
// The audit reads the stylesheets from disk: Vitest hands `.css` imports over empty, even with `?raw`.
import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, test } from 'vitest';

/**
 * A static audit of every stylesheet of the TV (TVUI-01 AC 2-4; AD-016, AD-017). Each rule is a function that lists
 * the violations of one CSS text; a case shows that it catches a bad sample, then the package's CSS must have none.
 */

/** Every `.css` file of `src/styles/`, by file name. */
const PACKAGE_CSS = readStylesheets(new URL('.', import.meta.url));

function readStylesheets(dir: URL): Record<string, string> {
  const sheets: Record<string, string> = {};
  for (const name of readdirSync(dir).filter((file) => file.endsWith('.css'))) sheets[name] = readFileSync(new URL(name, dir), 'utf8');
  return sheets;
}

/** Every `.tsx` of `src/`, by path from `src/`: no component or screen writes a color (AD-017). */
const SOURCE_TSX = readSources(new URL('../', import.meta.url));

function readSources(dir: URL): Record<string, string> {
  const sources: Record<string, string> = {};
  const names = readdirSync(dir, { recursive: true, encoding: 'utf8' }).map((name) => name.replaceAll('\\', '/'));
  for (const name of names.filter((file) => file.endsWith('.tsx'))) sources[name] = readFileSync(new URL(name, dir), 'utf8');
  return sources;
}

/** The largest px size a width or height may use: icons and borders (AD-016). */
const MAX_PX_DETAIL = 64;

/** Properties that size a box. */
const SIZE_PROPERTIES = new Set(['width', 'height', 'min-width', 'min-height', 'max-width', 'max-height', 'flex-basis']);

/** The only properties an animation or transition may move (TVUI-01 AC 3). */
const ANIMATABLE = new Set(['transform', 'opacity']);

/** CSS named colors a stylesheet could write instead of a theme variable (the common ones). */
const NAMED_COLORS = new Set(['white', 'black', 'red', 'green', 'blue', 'yellow', 'orange', 'purple', 'pink', 'gray', 'grey', 'gold', 'silver']);

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

/** CSS Grid and the flex shorthand for spacing, which the TV-class browsers of DESIGN §4.5 may lack (TVUI-01 AC 2). */
function gridAndSpacing(css: string): string[] {
  const isGridDisplay = (d: Declaration) => d.property === 'display' && /\b(inline-)?grid\b/.test(d.value);
  const isForbiddenProperty = (d: Declaration) => /^(grid(-.*)?|gap|row-gap|column-gap)$/.test(d.property);
  return declarations(css)
    .filter((d) => isGridDisplay(d) || isForbiddenProperty(d))
    .map((d) => `${d.property}: ${d.value}`);
}

/** Blur, backdrop filters, and transitions or keyframes of anything but transform and opacity (TVUI-01 AC 3). */
function heavyAnimation(css: string): string[] {
  const problems: string[] = [];
  for (const d of declarations(css)) {
    if (d.property.includes('backdrop-filter') || /\bblur\(/.test(d.value)) problems.push(`${d.property}: ${d.value}`);
    if (d.property !== 'transition' && d.property !== 'transition-property') continue;
    if (transitionProperties(d).some((moved) => !ANIMATABLE.has(moved))) problems.push(`${d.property}: ${d.value}`);
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

/** Literal colors: hex, rgb(), hsl() and named colors; only theme variables may carry a color (TVUI-01 AC 4, AD-017). */
function literalColors(css: string): string[] {
  const problems: string[] = [];
  for (const d of declarations(css)) {
    if (d.property.startsWith('--')) continue;
    const value = d.value.toLowerCase();
    const isFunctionOrHex = /#[0-9a-f]{3,8}\b/.test(value) || /\b(rgba?|hsla?|hwb|lab|lch|oklab|oklch)\(/.test(value);
    const words = value.match(/[a-z-]+/g) ?? [];
    if (isFunctionOrHex || words.some((word) => NAMED_COLORS.has(word))) problems.push(`${d.property}: ${d.value}`);
  }
  return problems;
}

/** Literal colors in source text: a quoted hex color, or rgb(), hsl() and their kin (AD-017). */
function sourceLiteralColors(text: string): string[] {
  const quotedHex = /(['"`])#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})\1/gi;
  const colorFunction = /\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch)\([^)]*\)/gi;
  return [...text.matchAll(quotedHex), ...text.matchAll(colorFunction)].map((match) => match[0]);
}

/** Widths and heights in px above the detail size; the layout scales in `rem` (AD-016). */
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
  expect(Object.keys(PACKAGE_CSS).length).toBeGreaterThan(20);
  expect(PACKAGE_CSS['board-grid.css']).toContain('.board-grid');
});

describe('TVUI-01 AC 2', () => {
  test('uses only flexbox and margins', () => {
    expect(packageViolations(gridAndSpacing)).toEqual({});
  });

  test('catches grid and its spacing in a sample', () => {
    expect(gridAndSpacing('.a { display: grid; }')).toHaveLength(1);
    expect(gridAndSpacing('.a { display: inline-grid; }')).toHaveLength(1);
    expect(gridAndSpacing('.a { grid-template-columns: 1fr 1fr; }')).toHaveLength(1);
    expect(gridAndSpacing('.a { gap: 1rem; }')).toHaveLength(1);
    expect(gridAndSpacing('.a { row-gap: 1rem; column-gap: 1rem; }')).toHaveLength(2);
    expect(gridAndSpacing('.a { display: flex; margin-top: 1rem; } /* display: grid */')).toEqual([]);
  });
});

describe('TVUI-01 AC 3', () => {
  test('animates only transform and opacity', () => {
    expect(packageViolations(heavyAnimation)).toEqual({});
  });

  test('catches blur, backdrop filters and heavy animations in a sample', () => {
    expect(heavyAnimation('.a { filter: blur(4px); }')).toHaveLength(1);
    expect(heavyAnimation('.a { backdrop-filter: saturate(2); }')).toHaveLength(1);
    expect(heavyAnimation('.a { transition: width 200ms; }')).toHaveLength(1);
    expect(heavyAnimation('.a { transition: all 200ms; }')).toHaveLength(1);
    expect(heavyAnimation('.a { transition-property: box-shadow; }')).toHaveLength(1);
    expect(heavyAnimation('@keyframes grow { from { width: 0; } to { width: 10%; } }')).toHaveLength(2);
    expect(heavyAnimation('.a { transition: transform 200ms, opacity 100ms; } @keyframes in { from { opacity: 0; transform: scale(0.9); } }')).toEqual([]);
  });
});

describe('TVUI-01 AC 4', () => {
  test('has no literal colors', () => {
    expect(packageViolations(literalColors)).toEqual({});
    expect(Object.keys(SOURCE_TSX)).toContain('screens/LobbyScreen.tsx');
    const report: Record<string, string[]> = {};
    for (const [path, text] of Object.entries(SOURCE_TSX)) {
      const problems = sourceLiteralColors(text);
      if (problems.length > 0) report[path] = problems;
    }
    expect(report).toEqual({});
  });

  test('catches literal colors in a sample', () => {
    expect(literalColors('.a { color: #fff; }')).toHaveLength(1);
    expect(literalColors('.a { color: rgb(255 0 0); }')).toHaveLength(1);
    expect(literalColors('.a { color: hsl(0 100% 50%); }')).toHaveLength(1);
    expect(literalColors('.a { color: white; }')).toHaveLength(1);
    expect(literalColors('.a { color: var(--color-primary); background: color-mix(in srgb, var(--color-valid) 20%, transparent); }')).toEqual([]);
    expect(sourceLiteralColors("const start = '#ffffff';")).toEqual(["'#ffffff'"]);
    expect(sourceLiteralColors('const shade = `rgb(0 0 0)`;')).toEqual(['rgb(0 0 0)']);
    expect(sourceLiteralColors('<a href="#main" style={{ color: player.color }} />')).toEqual([]);
  });
});

describe('AD-016', () => {
  test('sizes containers only with relative units', () => {
    expect(packageViolations(largePixelSizes)).toEqual({});
  });

  test('catches px sizes above the detail size in a sample', () => {
    expect(largePixelSizes('.a { width: 390px; }')).toHaveLength(1);
    expect(largePixelSizes('.a { min-height: calc(100% - 120px); }')).toHaveLength(1);
    expect(largePixelSizes('.a { width: 64px; height: 1px; min-width: min(90%, 40rem); }')).toEqual([]);
  });
});
