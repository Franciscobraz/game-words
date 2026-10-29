import '../styles/segmented.css';

/** One choice of a `Segmented`. */
export interface SegmentedOption<T extends number> {
  value: T;
  label: string;
}

/** Props of `Segmented`. */
export interface SegmentedProps<T extends number> {
  /** The name of the group, read by screen readers. */
  label: string;
  options: readonly SegmentedOption<T>[];
  selected: T;
  onSelect: (value: T) => void;
}

/** A row of buttons where one is chosen, as "4×4 / 5×5 / 6×6" and "MÍN. LETRAS" (HOST-01 AC 2, 6). */
export function Segmented<T extends number>({ label, options, selected, onSelect }: SegmentedProps<T>) {
  return (
    <div class="segmented" role="group" aria-label={label}>
      {options.map((option) => {
        const isSelected = option.value === selected;
        return (
          <button
            key={option.value}
            type="button"
            class={`segmented__option${isSelected ? ' segmented__option--selected' : ''}`}
            aria-pressed={isSelected}
            onClick={() => onSelect(option.value)}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
