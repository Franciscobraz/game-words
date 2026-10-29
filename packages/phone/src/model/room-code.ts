import { isRoomCode, ROOM_CODE_ALPHABET, ROOM_CODE_LENGTH } from '@bwords/core';

/** The four boxes of the "Entrar numa sala" screen, one letter or '' each (ENTRY-01 AC 2-3). */
export type CodeBoxes = readonly string[];

/** Four empty boxes. */
export const EMPTY_CODE_BOXES: CodeBoxes = Array.from({ length: ROOM_CODE_LENGTH }, () => '');

/**
 * The room code in a page path: `/kbxt` and `/KBXT` both open KBXT (ENTRY-01 AC 1).
 * Returns null for `/` and for anything that is not a well-formed code, which
 * sends the player to the code screen (ENTRY-01 AC 2).
 */
export function parseRoomPath(pathname: string): string | null {
  const candidate = pathname.replace(/^\//, '').toUpperCase();
  return isRoomCode(candidate) ? candidate : null;
}

/**
 * Types `letter` into box `index`: it shows in upper case (ENTRY-01 AC 3). A key
 * outside the room alphabet (I, O, digits, symbols) leaves the boxes as they are,
 * the same object, so the screen knows not to move the focus. '' clears the box.
 */
export function typeCodeLetter(boxes: CodeBoxes, index: number, letter: string): CodeBoxes {
  if (index < 0 || index >= boxes.length) return boxes;
  const upper = letter.toUpperCase();
  const isValid = upper === '' || (upper.length === 1 && ROOM_CODE_ALPHABET.includes(upper));
  if (!isValid) return boxes;
  return boxes.map((box, i) => (i === index ? upper : box));
}

/** The code once all four boxes are filled, for "CONTINUAR" (ENTRY-01 AC 4); null before that. */
export function completeCode(boxes: CodeBoxes): string | null {
  const code = boxes.join('');
  return isRoomCode(code) ? code : null;
}
