import type { LongestResult, PlayerInfo } from '@bwords/core';
import { STRINGS } from '../strings/pt-BR.ts';
import { displayWord } from './word-rows.ts';

/** What the card of the longest word says (TVRES-01 AC 6). */
export interface LongestCard {
  word: string;
  spellings: readonly string[];
  finders: string;
}

/** The longest word with its spellings and who found it, or that nobody did (TVRES-01 AC 6). */
export function longestCard(longest: LongestResult, players: readonly PlayerInfo[]): LongestCard {
  const nicknames = longest.foundBy.flatMap((id) => players.find((player) => player.id === id)?.nickname ?? []);
  return {
    word: displayWord(longest.word),
    spellings: longest.spellings ?? [],
    finders: nicknames.length === 0 ? STRINGS.nobodyFoundLongest : STRINGS.foundLongest(nicknames),
  };
}
