/**
 * Counting and showing nicknames the way the server counts them: in code points,
 * so "João" has 4 characters (JOIN-01 AC 1, `cleanNickname` in the core).
 */

/** Characters of the nickname as typed, for the "N/12" counter (JOIN-01 AC 1). */
export function nicknameLength(text: string): number {
  return [...text.normalize('NFC')].length;
}

/** The upper-case first letter shown in the player's circle (AD-004); '' before anything is typed. */
export function initialOf(nickname: string): string {
  const [first = ''] = nickname.trim();
  return first.toUpperCase();
}
