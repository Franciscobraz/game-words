import type { ComponentChildren } from 'preact';
import type { Feedback } from '../model/judge.ts';
import '../styles/feedback-pill.css';
import { CancelIcon, CheckCircleIcon, HistoryIcon, HourglassIcon } from './icons.tsx';

/** Props of `FeedbackPill`. */
export interface FeedbackPillProps {
  kind: Feedback['kind'];
  /** "VÁLIDA (+2 PTS)", "JÁ ENCONTRADA", "INVÁLIDA" or "MUITO CURTA". */
  text: string;
}

/** The icon of each verdict (phone-feedbacks.png). */
const ICONS: Record<Feedback['kind'], () => ComponentChildren> = {
  valid: CheckCircleIcon,
  invalid: CancelIcon,
  'already-found': HistoryIcon,
  'too-short': HourglassIcon,
};

/** The verdict of a word: green valid, red invalid, yellow already found, grey too short (PLAY-01 AC 7-10). */
export function FeedbackPill({ kind, text }: FeedbackPillProps) {
  const Icon = ICONS[kind];
  return (
    <p class={`feedback-pill feedback-pill--${kind}`} role="status">
      <Icon />
      {text}
    </p>
  );
}
