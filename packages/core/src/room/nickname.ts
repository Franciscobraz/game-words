export const NICKNAME_MIN = 2;
export const NICKNAME_MAX = 12;

const CONTROL_RE = /\p{Cc}/u;
const DIACRITIC_RE = /\p{Mn}/gu;

/**
 * The nickname as stored: trimmed and in NFC. Returns null unless it has 2 to 12
 * code points after trimming and no control characters.
 */
export function cleanNickname(s: string): string | null {
  const name = s.trim().normalize('NFC');
  const length = [...name].length;
  if (length < NICKNAME_MIN || length > NICKNAME_MAX || CONTROL_RE.test(name)) return null;
  return name;
}

/** Comparison key: two nicknames clash when their keys are equal ("João" = "joao"). */
export function nicknameKey(s: string): string {
  return s.normalize('NFD').replace(DIACRITIC_RE, '').toLowerCase();
}
