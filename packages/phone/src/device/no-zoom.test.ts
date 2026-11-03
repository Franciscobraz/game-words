import { describe, expect, test } from 'vitest';
import { preventZoom } from './no-zoom.ts';

/** A cancelable event of `type`, with `fingers` on the screen when it is a touch. */
function touchEvent(type: string, fingers: number): Event {
  const event = new Event(type, { cancelable: true });
  Object.defineProperty(event, 'touches', { value: { length: fingers } });
  return event;
}

describe('preventZoom', () => {
  test('cancels a move of two fingers and lets a single finger through', () => {
    // NOZOOM-01 AC 2: the pinch is cancelled at two fingers; one finger is the swipe on the board.
    const page = new EventTarget();
    preventZoom(page);
    const oneFinger = touchEvent('touchmove', 1);
    const twoFingers = touchEvent('touchmove', 2);
    const threeFingers = touchEvent('touchmove', 3);

    page.dispatchEvent(oneFinger);
    page.dispatchEvent(twoFingers);
    page.dispatchEvent(threeFingers);

    expect(oneFinger.defaultPrevented).toBe(false);
    expect(twoFingers.defaultPrevented).toBe(true);
    expect(threeFingers.defaultPrevented).toBe(true);
  });

  test('cancels the pinch gestures of Safari', () => {
    // NOZOOM-01 AC 2: Safari on iOS zooms on a pinch even with user-scalable=no.
    const page = new EventTarget();
    preventZoom(page);
    const gestures = ['gesturestart', 'gesturechange', 'gestureend'].map((type) => new Event(type, { cancelable: true }));

    for (const gesture of gestures) page.dispatchEvent(gesture);

    expect(gestures.map((gesture) => gesture.defaultPrevented)).toEqual([true, true, true]);
  });

  test('leaves taps alone and stops when asked', () => {
    // NOZOOM-01 AC 3: a tap is never cancelled, so each tap of a double tap counts.
    const page = new EventTarget();
    const stop = preventZoom(page);
    const tap = touchEvent('touchstart', 1);
    page.dispatchEvent(tap);

    stop();
    const pinchAfterStop = touchEvent('touchmove', 2);
    page.dispatchEvent(pinchAfterStop);

    expect(tap.defaultPrevented).toBe(false);
    expect(pinchAfterStop.defaultPrevented).toBe(false);
  });
});
