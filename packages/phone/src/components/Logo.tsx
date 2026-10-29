import { STRINGS } from '../strings/pt-BR.ts';
import '../styles/logo.css';

/** Props of `Logo`. */
export interface LogoProps {
  /** In a pill of its own, as on the code screen (phone-code.png). */
  boxed?: boolean;
}

/** The "B BWords" mark of the screens before the room (phone-code.png, phone-join.png). */
export function Logo({ boxed = false }: LogoProps) {
  return (
    <span class={boxed ? 'logo logo--boxed' : 'logo'}>
      <span class="logo__mark" aria-hidden="true">
        B
      </span>
      <span class="logo__name">{STRINGS.brand}</span>
    </span>
  );
}
