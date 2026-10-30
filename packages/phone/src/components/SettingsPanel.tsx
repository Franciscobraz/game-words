import type { Settings } from '@bwords/core';
import { canStep, formatRoundTime, stepRounds, stepSeconds } from '../model/settings.ts';
import { STRINGS } from '../strings/pt-BR.ts';
import '../styles/settings-panel.css';
import { ArrowDropDownIcon, BookIcon, ShieldIcon } from './icons.tsx';
import { Segmented, type SegmentedOption } from './Segmented.tsx';
import { Stepper } from './Stepper.tsx';
import { Toggle } from './Toggle.tsx';
import { VolumeSlider } from './VolumeSlider.tsx';

/** The board sizes the host picks from (HOST-01 AC 2). */
const SIZE_OPTIONS: readonly SegmentedOption<Settings['size']>[] = ([4, 5, 6] as const).map((size) => ({
  value: size,
  label: STRINGS.boardSizeOption(size),
}));

/** The minimum word lengths the host picks from (HOST-01 AC 6). */
const MIN_LENGTH_OPTIONS: readonly SegmentedOption<Settings['minLength']>[] = ([3, 4] as const).map((minLength) => ({
  value: minLength,
  label: STRINGS.minLettersOption(minLength),
}));

/** The only dictionary of the MVP (HOST-01 AC 9). */
const DICTIONARY_PACK: Settings['pack'] = 'pt-BR';

/** Props of `SettingsPanel`. */
export interface SettingsPanelProps {
  /** The settings as the server last sent them; the panel never keeps its own copy (Edge Cases). */
  settings: Settings;
  onChangeSettings: (patch: Partial<Settings>) => void;
}

/**
 * The host's match settings: board, round time, rounds, minimum letters, the
 * profanity switch, the dictionary and the TV volume; each control asks the server for one
 * change (HOST-01 AC 2-9).
 */
export function SettingsPanel({ settings, onChangeSettings }: SettingsPanelProps) {
  return (
    <section class="settings-panel" aria-label={STRINGS.hostMatchRules}>
      <h3 class="settings-panel__label">{STRINGS.boardLabel}</h3>
      <Segmented label={STRINGS.boardLabel} options={SIZE_OPTIONS} selected={settings.size} onSelect={(size) => onChangeSettings({ size })} />

      <Stepper
        label={STRINGS.roundTime}
        display={formatRoundTime(settings.seconds)}
        canDecrease={canStep('seconds', settings.seconds, -1)}
        canIncrease={canStep('seconds', settings.seconds, 1)}
        onDecrease={() => onChangeSettings({ seconds: stepSeconds(settings.seconds, -1) })}
        onIncrease={() => onChangeSettings({ seconds: stepSeconds(settings.seconds, 1) })}
      />
      <Stepper
        label={STRINGS.rounds}
        display={String(settings.rounds)}
        canDecrease={canStep('rounds', settings.rounds, -1)}
        canIncrease={canStep('rounds', settings.rounds, 1)}
        onDecrease={() => onChangeSettings({ rounds: stepRounds(settings.rounds, -1) })}
        onIncrease={() => onChangeSettings({ rounds: stepRounds(settings.rounds, 1) })}
      />

      <h3 class="settings-panel__label">{STRINGS.minLetters}</h3>
      <Segmented
        label={STRINGS.minLetters}
        options={MIN_LENGTH_OPTIONS}
        selected={settings.minLength}
        onSelect={(minLength) => onChangeSettings({ minLength })}
      />

      <Toggle
        label={STRINGS.filterProfanity}
        icon={<ShieldIcon />}
        iconTone="valid"
        checked={settings.filterProfanity}
        onToggle={() => onChangeSettings({ filterProfanity: !settings.filterProfanity })}
      />

      <div class="settings-panel__dictionary">
        <span class="settings-panel__icon">
          <BookIcon />
        </span>
        <label class="settings-panel__dictionary-label" for="dictionary">
          {STRINGS.dictionary}
        </label>
        <span class="settings-panel__select">
          <select id="dictionary" value={DICTIONARY_PACK}>
            <option value={DICTIONARY_PACK}>{STRINGS.dictionaryPtBr}</option>
          </select>
          <ArrowDropDownIcon />
        </span>
      </div>

      <VolumeSlider
        volume={settings.volume}
        muted={settings.muted}
        onReleaseVolume={(volume) => onChangeSettings({ volume })}
        onToggleMute={() => onChangeSettings({ muted: !settings.muted })}
      />
    </section>
  );
}
