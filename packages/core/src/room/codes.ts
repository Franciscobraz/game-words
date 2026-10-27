/** Letters of a room code: A-Z without the ambiguous I and O. */
export const ROOM_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ';

export const ROOM_CODE_LENGTH = 4;

const ROOM_CODE_RE = new RegExp(`^[${ROOM_CODE_ALPHABET}]{${ROOM_CODE_LENGTH}}$`);

/** A random room code. `rand` returns floats in [0, 1), e.g. `mulberry32(seed)`. */
export function randomRoomCode(rand: () => number): string {
  let code = '';
  for (let i = 0; i < ROOM_CODE_LENGTH; i++) {
    code += ROOM_CODE_ALPHABET[Math.floor(rand() * ROOM_CODE_ALPHABET.length)];
  }
  return code;
}

/** Whether `s` is a well-formed room code: exactly 4 upper-case letters of the alphabet. */
export function isRoomCode(s: string): boolean {
  return ROOM_CODE_RE.test(s);
}

/**
 * Draws codes until `tryCreate` accepts one. `tryCreate` returns null when the code
 * already has an active room, and anything else when it created the room.
 */
export async function createWithFreeCode<T>(
  tryCreate: (code: string) => Promise<T | null>,
  rand: () => number,
): Promise<{ code: string; result: T }> {
  for (;;) {
    const code = randomRoomCode(rand);
    const result = await tryCreate(code);
    if (result !== null) return { code, result };
  }
}
