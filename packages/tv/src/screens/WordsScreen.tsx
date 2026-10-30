import { useMemo, useState } from 'preact/hooks';
import { BrandHeader } from '../components/BrandHeader.tsx';
import { RoomCard } from '../components/RoomCard.tsx';
import { WordRow } from '../components/WordRow.tsx';
import { WordScroll } from '../components/WordScroll.tsx';
import { qrMatrix, roomUrl } from '../model/qr.ts';
import { foundWordCount } from '../model/reveal.ts';
import { wordRows } from '../model/word-rows.ts';
import { useStore } from '../state/store.ts';
import { STRINGS } from '../strings/pt-BR.ts';
import '../styles/words.css';

/** The words of the round: the totals stand still and the list scrolls by itself (TVWORDS-01). */
export function WordsScreen() {
  const { room, reveal } = useStore();
  const { code, players, settings } = room.room.value;
  // From the reveal clock, not the view: a reconnect's `welcome` empties the view's results, and the scroll must not restart.
  const results = reveal.results.value;
  const plan = reveal.plan.value;
  // The players as the page opened: one kicked during the scroll keeps the circle on the words (Edge Cases).
  const [playersAtStart] = useState(players);
  const roomCode = code ?? '';
  const matrix = useMemo(() => qrMatrix(roomUrl(location.origin, roomCode)), [roomCode]);
  const rows = useMemo(() => (results === null ? [] : wordRows(results, playersAtStart)), [results, playersAtStart]);
  if (results === null || plan === null || settings === null) return null;
  const found = foundWordCount(results);
  return (
    <main class="screen words" data-testid="words-screen">
      <header class="words__header">
        <BrandHeader size="medium" />
        <div class="words__header-end">
          <p class="words__page">
            <span class="words__page-label">{STRINGS.wordsPageLabel}</span>
            <span class="words__page-separator">·</span>
            {STRINGS.roundLabel(results.index + 1, settings.rounds)}
          </p>
          <RoomCard label={null} code={roomCode} matrix={matrix} size="medium" />
        </div>
      </header>
      <div class="words__column">
        <div class="words__totals" data-testid="word-totals">
          <span class="words__total">
            <span class="words__count words__count--possible">{results.possibleWords}</span>
            {STRINGS.possibleWords(results.possibleWords)}
          </span>
          <span class="words__total">
            <span class="words__count words__count--found">{found}</span>
            {STRINGS.foundWords(found)}
          </span>
        </div>
        {found === 0 ? (
          <p class="words__empty">{STRINGS.noWordsFound}</p>
        ) : (
          <WordScroll durationMs={plan.scrollMs}>
            {rows.map((row, index) => (
              <WordRow row={row} key={index} />
            ))}
          </WordScroll>
        )}
      </div>
    </main>
  );
}
