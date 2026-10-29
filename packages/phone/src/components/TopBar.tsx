import type { ComponentChildren } from 'preact';
import { STRINGS } from '../strings/pt-BR.ts';
import '../styles/top-bar.css';
import { PersonIcon } from './icons.tsx';
import { RoomTag } from './RoomTag.tsx';

/** Props of `TopBar`. */
export interface TopBarProps {
  code: string;
  /** Opens the preferences sheet (PREF-01 AC 1). */
  onOpenPrefs?: () => void;
  /** The host's menu (⋮), only on the host's phone. */
  menu?: ComponentChildren;
}

/**
 * The top of a room screen: only the room tag, the preferences icon and, for the
 * host, the menu; no screen title and no connection indicator (UI-01 AC 6, AD-005, AD-006).
 */
export function TopBar({ code, onOpenPrefs, menu }: TopBarProps) {
  return (
    <header class="top-bar">
      <RoomTag code={code} />
      <div class="top-bar__actions">
        <button type="button" class="top-bar__prefs" aria-label={STRINGS.preferences} onClick={onOpenPrefs}>
          <PersonIcon />
        </button>
        {menu}
      </div>
    </header>
  );
}
