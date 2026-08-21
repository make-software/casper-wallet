import { shouldClearPasswordField } from './should-clear-password-field';

it('clears on the transition into a lockout', () => {
  expect(shouldClearPasswordField(false, true)).toBe(true);
});

it('does not clear again while the lockout stays armed', () => {
  expect(shouldClearPasswordField(true, true)).toBe(false);
});

it('does not clear when the lockout expires', () => {
  expect(shouldClearPasswordField(true, false)).toBe(false);
});

it('does nothing while no lockout is in play', () => {
  expect(shouldClearPasswordField(false, false)).toBe(false);
});
