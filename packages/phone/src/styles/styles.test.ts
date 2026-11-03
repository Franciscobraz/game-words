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

/** Every `.tsx` of `src/` but the tests, by path from `src/`: no component or screen writes a color (AD-017). */
const SOURCE_TSX = readSources(new URL('../', import.meta.url));

function readSources(dir: URL): Record<string, string> {
  const sources: Record<string, string> = {};
  const names = readdirSync(dir, { recursive: true, encoding: 'utf8' }).map((name) => name.replaceAll('\\', '/'));
  for (const name of names.filter((file) => file.endsWith('.tsx') && !file.endsWith('.test.tsx'))) {
    sources[name] = readFileSync(new URL(name, dir), 'utf8');
  }
  return sources;
}

/** The phone's `index.html`, whose `theme-color` repeats a theme token. */
const INDEX_HTML = readFileSync(new URL('../../index.html', import.meta.url), 'utf8');

/** The theme every client reads its colors from (`@bwords/theme`, AD-017). */
const THEME_TOKENS = readFileSync(new URL('../../../theme/tokens.css', import.meta.url), 'utf8');

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

/** Literal colors in source text: a quoted hex color, or rgb(), hsl() and their kin (AD-017). */
function sourceLiteralColors(text: string): string[] {
  const quotedHex = /(['"`])#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})\1/gi;
  const colorFunction = /\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch)\([^)]*\)/gi;
  return [...text.matchAll(quotedHex), ...text.matchAll(colorFunction)].map((match) => match[0]);
}

/** The content of `<meta name="theme-color">`, or null when the page has none. */
function themeColorOf(html: string): string | null {
  return /<meta\s+name="theme-color"\s+content="([^"]*)"/i.exec(html)?.[1] ?? null;
}

/** The value a CSS file gives to the custom property `name`, or null when it gives none. */
function tokenValue(css: string, name: string): string | null {
  const declaration = declarations(css).find((d) => d.property === name);
  return declaration?.value ?? null;
}

/** The page without comments and without its `theme-color` meta, the one color it must write. */
function htmlWithoutThemeColor(html: string): string {
  return html.replace(/<!--[\s\S]*?-->/g, '').replace(/<meta\s+name="theme-color"[^>]*>/i, '');
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

/** The narrowest phone the layout serves, in px: a `vw` size is smallest there (AD-016). */
const NARROWEST_PHONE_PX = 320;

/** The root font size a `rem` is read against. */
const ROOT_FONT_PX = 16;

/** The smallest font a text field may use: Safari zooms into a field with a smaller one when it gets the focus (NOZOOM-01 AC 1). */
const MIN_FIELD_FONT_PX = 16;

/** The `<input>` types a person types into; color pickers, sliders and boxes get no zoom on focus. */
const TEXT_INPUT_TYPES = new Set(['text', 'search', 'email', 'tel', 'url', 'password', 'number']);

/** The selectors of the text fields of a source: the class of each text `<input>`, or `input` without one, and `select`, `textarea`. */
function textFieldSelectors(source: string): string[] {
  const selectors: string[] = [];
  for (const match of source.matchAll(/<input\b([\s\S]*?)\/>/g)) {
    const attributes = match[1]!;
    const type = /\btype="([a-z]+)"/.exec(attributes)?.[1] ?? 'text';
    if (!TEXT_INPUT_TYPES.has(type)) continue;
    const className = /\bclass="([\w-]+)/.exec(attributes)?.[1];
    selectors.push(className === undefined ? 'input' : `.${className}`);
  }
  for (const match of source.matchAll(/<(select|textarea)\b/g)) selectors.push(match[1]!);
  return selectors;
}

/** Every custom property of the stylesheets, by name. */
function cssVariables(...sheets: string[]): Record<string, string> {
  const variables: Record<string, string> = {};
  for (const d of sheets.flatMap(declarations)) if (d.property.startsWith('--')) variables[d.property] = d.value;
  return variables;
}

/** The arguments of a CSS function, split at the commas outside any inner parentheses. */
function splitArguments(text: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let start = 0;
  for (let index = 0; index < text.length; index += 1) {
    if (text[index] === '(') depth += 1;
    if (text[index] === ')') depth -= 1;
    if (text[index] === ',' && depth === 0) {
      parts.push(text.slice(start, index));
      start = index + 1;
    }
  }
  parts.push(text.slice(start));
  return parts.map((part) => part.trim());
}

/** The smallest px a font size can reach on a phone from 320 px; NaN when the audit cannot read it. */
function smallestPx(value: string, variables: Record<string, string>): number {
  const variable = /^var\((--[\w-]+)\)$/.exec(value);
  if (variable !== null) {
    const resolved = variables[variable[1]!];
    return resolved === undefined ? Number.NaN : smallestPx(resolved, variables);
  }
  const call = /^(clamp|max|min)\((.*)\)$/.exec(value);
  if (call !== null) {
    const bounds = splitArguments(call[2]!).map((argument) => smallestPx(argument, variables));
    // A clamp never goes under its first argument; a max never under its largest; a min reaches its smallest.
    if (call[1] === 'clamp') return bounds[0]!;
    return call[1] === 'max' ? Math.max(...bounds) : Math.min(...bounds);
  }
  const length = /^(\d*\.?\d+)(px|rem|vw)$/.exec(value);
  if (length === null) return Number.NaN;
  const amount = Number(length[1]);
  if (length[2] === 'rem') return amount * ROOT_FONT_PX;
  if (length[2] === 'vw') return (amount * NARROWEST_PHONE_PX) / 100;
  return amount;
}

/** Whether one selector of a rule styles the field itself: its last compound names it, with no pseudo-element. */
function stylesField(selector: string, field: string): boolean {
  const last = selector.trim().split(/[\s>+~]+/).pop() ?? '';
  if (last.includes('::')) return false;
  const name = field.startsWith('.') ? `\\${field}` : `^${field}`;
  return new RegExp(`${name}(?![\\w-])`).test(last);
}

/** The text fields whose font can go under 16 px, or that set no font size at all, with the size that does it. */
function smallTextFields(css: string, fields: readonly string[], variables: Record<string, string>): string[] {
  const rules = [...stripComments(css).matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((match) => ({
    selectors: match[1]!.split(','),
    body: match[2]!,
  }));
  const problems: string[] = [];
  for (const field of fields) {
    const sizes = rules
      .filter((rule) => rule.selectors.some((selector) => stylesField(selector, field)))
      .flatMap((rule) => declarations(`{${rule.body}}`).filter((d) => d.property === 'font-size'));
    if (sizes.length === 0) problems.push(`${field}: no font-size`);
    for (const size of sizes) if (!(smallestPx(size.value, variables) >= MIN_FIELD_FONT_PX)) problems.push(`${field}: ${size.value}`);
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

describe('UI-01 AC 2 (AD-017) outside the stylesheets', () => {
  test('writes no literal color in the components and screens', () => {
    expect(Object.keys(SOURCE_TSX)).toContain('screens/JoinScreen.tsx');
    const report: Record<string, string[]> = {};
    for (const [path, text] of Object.entries(SOURCE_TSX)) {
      const problems = sourceLiteralColors(text);
      if (problems.length > 0) report[path] = problems;
    }
    expect(report).toEqual({});
  });

  test('catches literal colors in a sample source', () => {
    expect(sourceLiteralColors("const start = '#ffffff';")).toEqual(["'#ffffff'"]);
    expect(sourceLiteralColors('<p style={{ color: "#12131a80" }} />')).toHaveLength(1);
    expect(sourceLiteralColors('const shade = `rgb(0 0 0)`;')).toEqual(['rgb(0 0 0)']);
    expect(sourceLiteralColors("const tint = 'hsl(0 100% 50%)';")).toHaveLength(1);
    expect(sourceLiteralColors('<a href="#main" style={{ color: player.color }} />')).toEqual([]);
  });

  test('keeps the index.html theme-color equal to the theme background and writes no other color', () => {
    // The meta is read before any stylesheet, so it holds the value of --color-background itself.
    const background = tokenValue(THEME_TOKENS, '--color-background');
    expect(background).not.toBeNull();
    expect(themeColorOf(INDEX_HTML)?.toLowerCase()).toBe(background?.toLowerCase());
    expect(sourceLiteralColors(htmlWithoutThemeColor(INDEX_HTML))).toEqual([]);
  });

  test('catches a theme-color that drifts from the token in a sample page', () => {
    const page = '<head><meta name="theme-color" content="#000000" /><meta name="x" content="#ff0000" /></head>';
    expect(themeColorOf(page)).toBe('#000000');
    expect(tokenValue(':root { --color-background: #12131a; }', '--color-background')).toBe('#12131a');
    expect(sourceLiteralColors(htmlWithoutThemeColor(page))).toEqual(['"#ff0000"']);
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

describe('NOZOOM-01 AC 1', () => {
  test('keeps every text field at 16 px or more', () => {
    const fields = [...new Set(Object.values(SOURCE_TSX).flatMap(textFieldSelectors))];
    expect(fields).toEqual(expect.arrayContaining(['.code-entry__box', '.join__input', 'select']));
    const variables = cssVariables(THEME_TOKENS, PACKAGE_CSS['tokens.css'] ?? '');

    expect(smallTextFields(Object.values(PACKAGE_CSS).join('\n'), fields, variables)).toEqual([]);
  });

  test('catches a text field that can go under 16 px in a sample', () => {
    const variables = { '--font-size-body': 'clamp(0.875rem, 3.8vw, 1rem)', '--font-size-field': '1rem' };
    const fields = textFieldSelectors('<input class="name" type="text" onInput={(e) => set(e)} /><input class="hue" type="color" /><select />');
    expect(fields).toEqual(['.name', 'select']);

    expect(smallTextFields('.name { font-size: 15px; } .name:focus { font-size: 2rem; }', fields, variables)).toEqual([
      '.name: 15px',
      'select: no font-size',
    ]);
    expect(smallTextFields('.panel select { font-size: var(--font-size-body); }', ['select'], variables)).toEqual([
      'select: var(--font-size-body)',
    ]);
    expect(smallTextFields('.name { font-size: 4vw; }', ['.name'], variables)).toEqual(['.name: 4vw']);
    expect(smallTextFields('.name::placeholder { font-size: 10px; } .name { font-size: max(16px, 3vw); }', ['.name'], variables)).toEqual([]);
    expect(smallTextFields('.a select, .name { font-size: var(--font-size-field); }', ['.name', 'select'], variables)).toEqual([]);
    expect(smallTextFields('.name { font-size: calc(1rem + 1px); }', ['.name'], variables)).toEqual(['.name: calc(1rem + 1px)']);
  });
});
