import { useState } from 'preact/hooks';
import { STRINGS } from '../strings/pt-BR.ts';
import '../styles/host-menu.css';
import { ConfirmDialog } from './ConfirmDialog.tsx';
import { MoreVertIcon } from './icons.tsx';

/** One entry of the host's menu; it acts only after its confirmation. */
export interface HostMenuItem {
  label: string;
  /** The question asked before acting, as "Encerrar a sala? Todos os jogadores saem.". */
  confirm: string;
  onConfirm: () => void;
}

/** Props of `HostMenu`. */
export interface HostMenuProps {
  items: readonly HostMenuItem[];
}

/**
 * The host's menu (⋮) in the top bar; every entry asks for a confirmation and only
 * then acts (HOST-01 AC 15, HOSTPLAY-01).
 */
export function HostMenu({ items }: HostMenuProps) {
  const [isOpen, setOpen] = useState(false);
  const [confirming, setConfirming] = useState<HostMenuItem | null>(null);

  function choose(item: HostMenuItem): void {
    setOpen(false);
    setConfirming(item);
  }

  function confirm(item: HostMenuItem): void {
    setConfirming(null);
    item.onConfirm();
  }

  return (
    <div class="host-menu">
      <button type="button" class="host-menu__toggle" aria-label={STRINGS.hostMenu} aria-expanded={isOpen} onClick={() => setOpen(!isOpen)}>
        <MoreVertIcon />
      </button>
      {isOpen && (
        <>
          <div class="host-menu__backdrop" aria-hidden="true" onClick={() => setOpen(false)} />
          <ul class="host-menu__list" role="menu">
            {items.map((item) => (
              <li key={item.label} role="none">
                <button type="button" role="menuitem" class="host-menu__item" onClick={() => choose(item)}>
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
      {confirming !== null && (
        <ConfirmDialog
          message={confirming.confirm}
          confirmLabel={confirming.label}
          onConfirm={() => confirm(confirming)}
          onCancel={() => setConfirming(null)}
        />
      )}
    </div>
  );
}
