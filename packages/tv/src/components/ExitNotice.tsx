import { BrandHeader } from './BrandHeader.tsx';
import '../styles/exit-notice.css';

/** Props of `ExitNotice`. */
export interface ExitNoticeProps {
  title: string;
  /** What to do next; null when there is nothing to do. */
  hint: string | null;
}

/** The logo at the top and one message in the center, with no footer, room code or QR (TVEXIT-01 AC 2, 4). */
export function ExitNotice({ title, hint }: ExitNoticeProps) {
  return (
    <div class="exit-notice">
      <header class="exit-notice__header">
        <BrandHeader size="large" />
      </header>
      <div class="exit-notice__body">
        <h1 class="exit-notice__title">{title}</h1>
        {hint !== null && <p class="exit-notice__hint">{hint}</p>}
      </div>
    </div>
  );
}
