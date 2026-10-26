/** Points of a normalized word: 3 letters = 1, 4 = 2, 5 = 3, +1 per extra letter ("Qu" counts as 2 letters). */
export function wordPoints(word: string): number {
  return Math.max(0, word.length - 2);
}

export interface RoundScore<P> {
  /** Points per player: unique words count double, shared words count once. */
  totals: Map<P, number>;
  /** Words only that player found, sorted. */
  unique: Map<P, string[]>;
  /** Words found by two or more players, sorted. */
  shared: string[];
}

/** Scores a round from each player's accepted words. Rejected submissions never reach it, so nothing is deducted. */
export function scoreRound<P>(found: ReadonlyMap<P, ReadonlySet<string>>): RoundScore<P> {
  const finders = new Map<string, number>();
  for (const words of found.values()) for (const w of words) finders.set(w, (finders.get(w) ?? 0) + 1);

  const totals = new Map<P, number>();
  const unique = new Map<P, string[]>();
  for (const [player, words] of found) {
    let total = 0;
    const own: string[] = [];
    for (const w of words) {
      const isUnique = finders.get(w) === 1;
      total += wordPoints(w) * (isUnique ? 2 : 1);
      if (isUnique) own.push(w);
    }
    totals.set(player, total);
    unique.set(player, own.sort());
  }
  const shared = [...finders].filter(([, n]) => n > 1).map(([w]) => w).sort();
  return { totals, unique, shared };
}
