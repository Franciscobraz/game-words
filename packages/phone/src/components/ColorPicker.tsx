import type { ColorSlot } from '../model/colors.ts';
import { STRINGS } from '../strings/pt-BR.ts';
import '../styles/color-picker.css';
import { AddIcon, BlockIcon, CheckIcon } from './icons.tsx';

/** Props of `ColorPicker`. */
export interface ColorPickerProps {
  slots: readonly ColorSlot[];
  /** Index of the slot shown as picked; -1 for none. */
  selected: number;
  /** The color the custom slot shows and its system picker starts from. */
  customColor: string;
  onPickColor: (color: string) => void;
}

/**
 * The ten palette colors and "Personalizada" in a row that scrolls sideways; a
 * color of another player is locked with the owner's nickname (JOIN-01 AC 2-3).
 */
export function ColorPicker({ slots, selected, customColor, onPickColor }: ColorPickerProps) {
  return (
    <ul class="color-picker">
      {slots.map((slot, index) => (
        <li key={index} class="color-picker__item">
          {slot.kind === 'custom' ? (
            <CustomSlot color={customColor} isSelected={index === selected} onPickColor={onPickColor} />
          ) : (
            <PaletteSlot slot={slot} position={index + 1} isSelected={index === selected} onPickColor={onPickColor} />
          )}
        </li>
      ))}
    </ul>
  );
}

interface PaletteSlotProps {
  slot: Exclude<ColorSlot, { kind: 'custom' }>;
  position: number;
  isSelected: boolean;
  onPickColor: (color: string) => void;
}

function PaletteSlot({ slot, position, isSelected, onPickColor }: PaletteSlotProps) {
  const isLocked = slot.kind === 'locked';
  return (
    <>
      <button
        type="button"
        class={`color-picker__swatch${isSelected ? ' color-picker__swatch--selected' : ''}${isLocked ? ' color-picker__swatch--locked' : ''}`}
        style={{ backgroundColor: slot.color, color: slot.color }}
        aria-label={STRINGS.colorOption(position)}
        aria-pressed={isSelected}
        disabled={isLocked}
        onClick={() => onPickColor(slot.color)}
      >
        {isLocked && <BlockIcon />}
        {isSelected && <CheckIcon />}
      </button>
      <span class="color-picker__caption" style={isSelected ? { color: slot.color } : undefined}>
        {captionOf(slot, isSelected)}
      </span>
    </>
  );
}

/** Under a locked color its owner, under the picked one "Você", under the others nothing. */
function captionOf(slot: PaletteSlotProps['slot'], isSelected: boolean): string {
  if (slot.kind === 'locked') return slot.owner;
  if (isSelected) return STRINGS.youLabel;
  return '';
}

interface CustomSlotProps {
  color: string;
  isSelected: boolean;
  onPickColor: (color: string) => void;
}

/** The 11th option: the system color picker, under a circle in the custom color (JOIN-01 AC 2). */
function CustomSlot({ color, isSelected, onPickColor }: CustomSlotProps) {
  return (
    <>
      <span
        class={`color-picker__swatch color-picker__swatch--custom${isSelected ? ' color-picker__swatch--selected' : ''}`}
        style={isSelected ? { backgroundColor: color, color } : undefined}
      >
        {isSelected ? <CheckIcon /> : <AddIcon />}
        <input
          class="color-picker__system"
          type="color"
          aria-label={STRINGS.customColor}
          value={color}
          onInput={(event) => onPickColor(event.currentTarget.value)}
        />
      </span>
      <span class="color-picker__caption">{STRINGS.customColor}</span>
    </>
  );
}
