/** The upper-case first letter shown in the player's circle (AD-004). */
export function initialOf(nickname: string): string {
  const [first = ''] = nickname.trim();
  return first.toUpperCase();
}
