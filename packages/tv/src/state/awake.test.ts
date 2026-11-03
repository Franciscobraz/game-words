import { CLOSE_REASONS, type CloseReason, type Phase } from '@bwords/core';
import { signal } from '@preact/signals';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { INITIAL_VIEW, type RoomView } from '../model/room-view.ts';
import { createKeepAwake, keepsAwake, type WakeLock } from './awake.ts';

const PHASES: readonly (Phase | null)[] = [null, 'lobby', 'round', 'words', 'results', 'podium'];

/** The wake lock and the page's visibility, as the browser handles them; `refuses` makes every request fail. */
function fakeScreen(refuses = false) {
  const listeners = new Set<() => void>();
  const screen = {
    held: false,
    requests: 0,
    wakeLock: {
      request: () => {
        screen.requests += 1;
        if (refuses) return Promise.reject(new Error('NotAllowedError'));
        screen.held = true;
        return Promise.resolve();
      },
      release: () => {
        screen.held = false;
      },
    } satisfies WakeLock,
    onVisible(listener: () => void) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    /** The page goes to the background: the browser lets go of the wake lock on its own. */
    hide() {
      screen.held = false;
    },
    show() {
      for (const listener of listeners) listener();
    },
  };
  return screen;
}

function inPhase(phase: Phase | null): RoomView {
  return { ...INITIAL_VIEW, code: phase === null ? null : 'KBXT', phase };
}

function closedBy(reason: CloseReason): RoomView {
  return { ...inPhase('lobby'), closeReason: reason };
}

/** Lets the promises of the wake lock settle. */
async function settle(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('createKeepAwake', () => {
  test('holds a screen wake lock while the page is open and visible', () => {
    // TVAWAKE-01 AC 1: in every phase, from the opening of the room to the podium.
    const screen = fakeScreen();
    const room = signal(inPhase(null));
    createKeepAwake({ wakeLock: screen.wakeLock, onVisible: screen.onVisible, room });

    for (const phase of PHASES) {
      room.value = inPhase(phase);
      expect(screen.held, `phase ${String(phase)}`).toBe(true);
    }
  });

  test('lets the screen sleep once the room expires or the tab is replaced', () => {
    // Assumption "Quando a tela fica ativa": until the room expires.
    for (const reason of ['idle', 'tv-gone', 'replaced'] as const) {
      const screen = fakeScreen();
      const room = signal(inPhase('round'));
      createKeepAwake({ wakeLock: screen.wakeLock, onVisible: screen.onVisible, room });

      room.value = closedBy(reason);

      expect(screen.held, reason).toBe(false);
    }
  });

  test('asks for the wake lock again when the page comes back', () => {
    // TVAWAKE-01 AC 2: the browser drops the wake lock when the page hides.
    const screen = fakeScreen();
    const room = signal(inPhase('lobby'));
    createKeepAwake({ wakeLock: screen.wakeLock, onVisible: screen.onVisible, room });
    screen.hide();
    expect(screen.held).toBe(false);

    screen.show();

    expect(screen.held).toBe(true);
  });

  test('does not ask again on the way back once the room expired', () => {
    const screen = fakeScreen();
    const room = signal(closedBy('idle'));
    createKeepAwake({ wakeLock: screen.wakeLock, onVisible: screen.onVisible, room });

    screen.show();

    expect(screen.requests).toBe(0);
  });

  test('goes on when the browser refuses the wake lock', async () => {
    // TVAWAKE-01 AC 4: a refusal, or a browser without the API, is logged and nothing throws.
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const screen = fakeScreen(true);
    const room = signal(inPhase('lobby'));

    expect(() => createKeepAwake({ wakeLock: screen.wakeLock, onVisible: screen.onVisible, room })).not.toThrow();
    room.value = inPhase('round');
    screen.show();
    await settle();

    expect(screen.requests).toBe(2);
    expect(screen.held).toBe(false);
    expect(warn).toHaveBeenCalledWith('The screen wake lock was refused', expect.any(Error));
  });
});

describe('keepsAwake', () => {
  test('keeps the screen on in every phase and after each close reason that opens another room', () => {
    for (const phase of PHASES) expect(keepsAwake(inPhase(phase)), `phase ${String(phase)}`).toBe(true);
    const expected: Record<CloseReason, boolean> = {
      idle: false,
      'tv-gone': false,
      replaced: false,
      'closed-by-host': true,
      kicked: true,
    };
    for (const reason of CLOSE_REASONS) expect(keepsAwake(closedBy(reason)), reason).toBe(expected[reason]);
  });
});
