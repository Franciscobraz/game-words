import type { Settings } from '@bwords/core';
import { formatRoundTime } from '../model/settings.ts';
import { STRINGS } from '../strings/pt-BR.ts';
import { Chip } from './Chip.tsx';
import { GridIcon, RepeatIcon, SpellcheckIcon, TimerIcon } from './icons.tsx';

/** Props of `RuleChips`. */
export interface RuleChipsProps {
  settings: Settings;
}

/** "Tabuleiro NxN", "M:SS min", "N Rodadas" and "Mín. N letras" (LOBBY-01 AC 6). */
export function RuleChips({ settings }: RuleChipsProps) {
  return (
    <div class="chip-row">
      <Chip icon={<GridIcon />} iconTone="action" label={STRINGS.boardChip(settings.size)} />
      <Chip icon={<TimerIcon />} iconTone="secondary" label={STRINGS.timeChip(formatRoundTime(settings.seconds))} />
      <Chip icon={<RepeatIcon />} iconTone="valid" label={STRINGS.roundsChip(settings.rounds)} />
      <Chip icon={<SpellcheckIcon />} iconTone="plain" label={STRINGS.minLengthChip(settings.minLength)} />
    </div>
  );
}
