import { STRINGS } from '../strings/pt-BR.ts';
import '../styles/volume-slider.css';
import { TvIcon, VolumeOffIcon, VolumeUpIcon } from './icons.tsx';

/** The loudest TV volume the server accepts (0-100). */
const VOLUME_MAX = 100;

/** Props of `VolumeSlider`. */
export interface VolumeSliderProps {
  volume: number;
  muted: boolean;
  /** Called once, when the host lets go of the slider. */
  onReleaseVolume: (volume: number) => void;
  onToggleMute: () => void;
}

/** "Volume da TV": a 0-100 slider sent on release, and the mute button beside it (HOST-01 AC 8). */
export function VolumeSlider({ volume, muted, onReleaseVolume, onToggleMute }: VolumeSliderProps) {
  return (
    <div class="volume-slider">
      <div class="volume-slider__row">
        <span class="volume-slider__icon">
          <TvIcon />
        </span>
        <label class="volume-slider__label" for="tv-volume">
          {STRINGS.tvVolume}
        </label>
        <button type="button" class="volume-slider__mute" aria-label={STRINGS.muteTv} aria-pressed={muted} onClick={onToggleMute}>
          {muted ? <VolumeOffIcon /> : <VolumeUpIcon />}
        </button>
      </div>
      {/* Free while dragged; `change` fires on release, and a new volume from the server remounts it. */}
      <input
        key={volume}
        id="tv-volume"
        class="volume-slider__range"
        type="range"
        min={0}
        max={VOLUME_MAX}
        defaultValue={String(volume)}
        onChange={(event) => onReleaseVolume(Number(event.currentTarget.value))}
      />
    </div>
  );
}
