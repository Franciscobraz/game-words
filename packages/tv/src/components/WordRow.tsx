import type { WordRow as WordRowData } from '../model/word-rows.ts';
import { STRINGS } from '../strings/pt-BR.ts';
import '../styles/word-row.css';
import { PlayerCircle } from './PlayerCircle.tsx';

/** Props of `WordRow`. */
export interface WordRowProps {
  row: WordRowData;
}

/** A line of the words' list: a group's title or a word, with who found it and its points (TVWORDS-01 AC 3, 5). */
export function WordRow({ row }: WordRowProps) {
  return row.kind === 'title' ? <GroupTitle group={row.group} /> : <FoundWord row={row} />;
}

interface GroupTitleProps {
  group: 'shared' | 'unique';
}

function GroupTitle({ group }: GroupTitleProps) {
  return (
    <div class="word-row word-row--title">
      <h2 class="word-row__title">{group === 'shared' ? STRINGS.sharedWordsTitle : STRINGS.uniqueWordsTitle}</h2>
      {group === 'unique' && <span class="word-row__pill">{STRINGS.doublePoints}</span>}
    </div>
  );
}

interface FoundWordProps {
  row: Extract<WordRowData, { kind: 'word' }>;
}

function FoundWord({ row }: FoundWordProps) {
  return (
    <div class={row.striped ? 'word-row word-row--striped' : 'word-row'} data-testid="word-row">
      <span class="word-row__word">{row.word}</span>
      <span class="word-row__spellings">{row.spellings.length > 0 && STRINGS.spellings(row.spellings)}</span>
      {row.finders.map((finder) => (
        <span class="word-row__finder" key={finder.id}>
          <PlayerCircle nickname={finder.nickname} color={finder.color} shape="small-circle" />
        </span>
      ))}
      <span class={`word-row__points word-row__points--${row.group}`}>{STRINGS.wordPoints(row.points)}</span>
    </div>
  );
}
