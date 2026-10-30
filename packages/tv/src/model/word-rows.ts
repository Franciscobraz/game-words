import type { PlayerInfo, ResultWord, RoundResultsMessage } from '@bwords/core';

/** A line of the words' list: a group's title or a found word (TVWORDS-01 AC 3, 5). */
export type WordRow =
  | { kind: 'title'; group: 'shared' | 'unique' }
  | {
      kind: 'word';
      group: 'shared' | 'unique';
      /** In upper case, without accents. */
      word: string;
      /** The real spellings, as the dictionary has them; empty when the word has none to show. */
      spellings: readonly string[];
      finders: readonly PlayerInfo[];
      points: number;
      /** Every other line of a group has a background (tv-words.png). */
      striped: boolean;
    };

/** A found word and who found it, before it becomes a line. */
interface FoundWord {
  word: ResultWord;
  finderIds: readonly string[];
}

/**
 * The lines of the words' page: the shared words and then the unique ones, each group under its title, from the shortest
 * word to the longest and alphabetically within a length. A group with no words has no title. `players` is what the TV
 * knows now: a finder it no longer knows loses the circle, but the word stays on the list (TVWORDS-01 AC 3-5, Edge Cases).
 */
export function wordRows(results: RoundResultsMessage, players: readonly PlayerInfo[]): WordRow[] {
  const shared = results.shared.map((word) => ({ word, finderIds: word.foundBy }));
  const unique = results.players.flatMap((player) => player.unique.map((word) => ({ word, finderIds: [player.playerId] })));
  return [...groupRows('shared', shared, players), ...groupRows('unique', unique, players)];
}

function groupRows(group: 'shared' | 'unique', words: readonly FoundWord[], players: readonly PlayerInfo[]): WordRow[] {
  if (words.length === 0) return [];
  const ordered = [...words].sort((a, b) => compareWords(a.word.word, b.word.word));
  return [{ kind: 'title', group }, ...ordered.map((found, index) => wordRow(group, found, index, players))];
}

function compareWords(a: string, b: string): number {
  return a.length - b.length || a.localeCompare(b);
}

function wordRow(group: 'shared' | 'unique', { word, finderIds }: FoundWord, index: number, players: readonly PlayerInfo[]): WordRow {
  return {
    kind: 'word',
    group,
    word: displayWord(word.word),
    spellings: word.spellings ?? [],
    finders: finderIds.flatMap((id) => players.find((player) => player.id === id) ?? []),
    points: word.points,
    striped: index % 2 === 0,
  };
}

/** Upper case without accents (TVWORDS-01 AC 5). */
function displayWord(word: string): string {
  const withoutAccents = word.normalize('NFD').replace(/\p{Mark}/gu, '');
  return withoutAccents.toUpperCase();
}
