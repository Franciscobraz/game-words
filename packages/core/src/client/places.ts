/**
 * Places of scores sorted from the highest: 1 + how many scored more, so a tie
 * shares the place and the next score skips it (M3 ranking rule, TVRES-01 AC 3).
 */
export function placesOf(sortedScores: readonly number[]): number[] {
  return sortedScores.map((score) => 1 + sortedScores.filter((other) => other > score).length);
}
