/** Whether the browser can vibrate; without it the preferences hide "Vibrar" (PREF-01 AC 3). */
export function canVibrate(): boolean {
  return typeof navigator.vibrate === 'function';
}

/** Vibrates for `ms` when the browser can (PLAY-01 AC 18). */
export function vibrate(ms: number): void {
  if (canVibrate()) navigator.vibrate(ms);
}
