import { STRINGS } from '../strings/pt-BR.ts';
import '../styles/logo.css';

/** The "B BWords" mark of the screens before the room (phone-code.png, phone-join.png). */
export function Logo() {
  return (
    <span class="logo">
      <span class="logo__mark" aria-hidden="true">
        B
      </span>
      <span class="logo__name">{STRINGS.brand}</span>
    </span>
  );
}
