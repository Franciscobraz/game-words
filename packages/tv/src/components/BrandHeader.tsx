import { STRINGS } from '../strings/pt-BR.ts';
import '../styles/brand-header.css';

/** Props of `BrandHeader`. */
export interface BrandHeaderProps {
  /** Each screen's size: lobby, words, result and round (tv-lobby.png, tv-words.png, tv-round-result.png, tv-round.png). */
  size: 'large' | 'medium' | 'compact' | 'small';
}

/** The "B" mark and the name of the game, with no decorative text (TVUI-01 AC 7). */
export function BrandHeader({ size }: BrandHeaderProps) {
  return (
    <span class={`brand-header brand-header--${size}`}>
      <span class="brand-header__mark" aria-hidden="true">
        {STRINGS.brandMark}
      </span>
      <span class="brand-header__name">{STRINGS.brand}</span>
    </span>
  );
}
