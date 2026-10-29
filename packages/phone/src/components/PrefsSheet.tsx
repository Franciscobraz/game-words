import { STRINGS } from '../strings/pt-BR.ts';
import '../styles/prefs-sheet.css';
import { VibrationIcon, VolumeUpIcon } from './icons.tsx';
import { Sheet, SheetAction } from './Sheet.tsx';
import { Toggle } from './Toggle.tsx';

/** The two switches of the sheet. */
export type PrefName = 'vibrate' | 'sound';

/** Props of `PrefsSheet`. */
export interface PrefsSheetProps {
  vibrate: boolean;
  sound: boolean;
  /** False without `navigator.vibrate`: "Vibrar" is not shown (PREF-01 AC 3). */
  canVibrate: boolean;
  onToggle: (name: PrefName) => void;
  onClose: () => void;
}

/** The player's preferences, opened by the person icon: "Vibrar", "Som ao acertar" and "Fechar" (PREF-01 AC 1-3). */
export function PrefsSheet({ vibrate, sound, canVibrate, onToggle, onClose }: PrefsSheetProps) {
  return (
    <Sheet label={STRINGS.preferences} onClose={onClose}>
      <h2 class="prefs-sheet__title">{STRINGS.preferences}</h2>
      <div class="prefs-sheet__switches">
        {canVibrate && (
          <Toggle label={STRINGS.vibrate} icon={<VibrationIcon />} iconTone="secondary" checked={vibrate} onToggle={() => onToggle('vibrate')} />
        )}
        <Toggle label={STRINGS.hitSound} icon={<VolumeUpIcon />} iconTone="secondary" checked={sound} onToggle={() => onToggle('sound')} />
      </div>
      <div class="sheet__actions">
        <SheetAction tone="quiet" onPress={onClose}>
          {STRINGS.close}
        </SheetAction>
      </div>
    </Sheet>
  );
}
