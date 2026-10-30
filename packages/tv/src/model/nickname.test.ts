import { expect, test } from 'vitest';
import { initialOf } from './nickname.ts';

test('shows the first letter of the nickname in upper case', () => {
  expect(initialOf('  ana')).toBe('A');
  expect(initialOf('Érica')).toBe('É');
});
