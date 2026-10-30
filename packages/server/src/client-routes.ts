import { isRoomCode } from '@bwords/core';

/**
 * A built client file: an alphanumeric first character, then letters, digits, dots, dashes and underscores.
 * Slashes and `%` stay out, so an encoded `..` can never walk out of the client's folder (PROTO-01 AC 8).
 */
const CLIENT_ASSET_ROUTE = /^\/(tv|phone)\/assets\/[A-Za-z0-9][A-Za-z0-9._-]*$/;

/**
 * The binding's default `html_handling` answers 307 from `/<client>/index.html` to `/<client>/`, and a redirect
 * would show the visitor a folder the routes refuse, so the pages are asked for by folder (proved in `e2e/assets.test.ts`).
 */
const TV_PAGE = '/tv/';
const PHONE_PAGE = '/phone/';

/**
 * The path in the assets binding behind a page path, or null for a 404 (SERVE-01): `/tv` and `/tv/` are the TV,
 * `/` and `/<CODE>` in any case are the phone, and each client reaches its own built files. It is a closed list,
 * so the language pack sitting next to the clients is never served (PROTO-01 AC 8).
 */
export function clientAsset(pathname: string): string | null {
  if (pathname === '/tv' || pathname === '/tv/') return TV_PAGE;
  // The phone opens a room from `/kbxt` as well as `/KBXT` (ENTRY-01 AC 1).
  if (pathname === '/' || isRoomCode(pathname.slice(1).toUpperCase())) return PHONE_PAGE;
  return CLIENT_ASSET_ROUTE.test(pathname) ? pathname : null;
}
