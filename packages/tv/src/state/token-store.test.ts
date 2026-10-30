import { describe, expect, test } from 'vitest';
import { fakeLocalStorage } from '../testing/fakes.ts';
import { createTokenStore, parseSavedRoom, type RoomStorage } from './token-store.ts';

const ROOM = { code: 'KBXT', tvToken: 'tv-secret' };

describe('token store', () => {
  test('gives back the room it saved', () => {
    const local = fakeLocalStorage();
    const tokens = createTokenStore(() => local);

    tokens.save(ROOM);

    expect(tokens.load()).toEqual(ROOM);
  });

  test('forgets the room on clear', () => {
    const local = fakeLocalStorage();
    const tokens = createTokenStore(() => local);
    tokens.save(ROOM);

    tokens.clear();

    expect(tokens.load()).toBeNull();
  });

  test('has no room when nothing was saved', () => {
    const local = fakeLocalStorage();

    expect(createTokenStore(() => local).load()).toBeNull();
  });

  test('has no room when the saved text is not valid', () => {
    const local = fakeLocalStorage({ 'bwords.tv.room': '{not json' });

    expect(createTokenStore(() => local).load()).toBeNull();
  });

  test('keeps working without saving when reaching the storage throws', () => {
    const blocked = (): RoomStorage => {
      throw new Error('Site data is blocked');
    };
    const tokens = createTokenStore(blocked);

    tokens.save(ROOM);
    tokens.clear();

    expect(tokens.load()).toBeNull();
  });

  test.each([
    ['null', null],
    ['text', 'KBXT'],
    ['a malformed code', { code: 'kb1', tvToken: 'tv-secret' }],
    ['a missing token', { code: 'KBXT' }],
    ['an empty token', { code: 'KBXT', tvToken: '' }],
    ['a token that is not text', { code: 'KBXT', tvToken: 7 }],
  ])('refuses %s as a room', (_, raw) => {
    expect(parseSavedRoom(raw)).toBeNull();
  });

  test('reads a well formed room, without any other field', () => {
    expect(parseSavedRoom({ ...ROOM, extra: true })).toEqual(ROOM);
  });
});
