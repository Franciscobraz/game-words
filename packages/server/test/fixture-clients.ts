/**
 * Minimal built clients, written next to the fixture pack as the Worker's static assets, so the route tests do not
 * depend on a full client build. Each file holds its own path: a response proves which file it came from.
 */
const CLIENT_FILES = ['index.html', 'assets/index-fixture.js', 'assets/index-fixture.css', 'assets/font-fixture.woff2'] as const;

/** The files of `public/<client>/`, by path from the assets root. */
export const FIXTURE_CLIENT_FILES: Readonly<Record<string, string>> = Object.fromEntries(
  ['tv', 'phone'].flatMap((client) => CLIENT_FILES.map((file) => [`${client}/${file}`, `fixture ${client}/${file}`])),
);
