/** Two fingers on the screen are a pinch; one finger is a tap or a swipe on the board, which must go on (NOZOOM-01 AC 2). */
export const PINCH_FINGERS = 2;

/** The pinch events of Safari on iOS, which zooms on a pinch whatever the viewport meta says. */
const SAFARI_GESTURES = ['gesturestart', 'gesturechange', 'gestureend'] as const;

/**
 * Keeps the page at its own scale on a pinch (NOZOOM-01 AC 2): Safari's gesture events and every move of two fingers
 * or more are cancelled, and a single finger is never touched, so the swipe on the board still forms words. The
 * listeners are not passive, so the browser waits for them before it zooms. Returns the function that stops it.
 */
export function preventZoom(target: EventTarget): () => void {
  const block = (event: Event) => event.preventDefault();
  const blockPinch = (event: Event) => {
    if (fingersOn(event) >= PINCH_FINGERS) event.preventDefault();
  };
  for (const type of SAFARI_GESTURES) target.addEventListener(type, block, { passive: false });
  target.addEventListener('touchmove', blockPinch, { passive: false });
  return () => {
    for (const type of SAFARI_GESTURES) target.removeEventListener(type, block);
    target.removeEventListener('touchmove', blockPinch);
  };
}

/** The fingers on the screen during a touch event; 0 for any other event. */
function fingersOn(event: Event): number {
  return (event as Partial<TouchEvent>).touches?.length ?? 0;
}
