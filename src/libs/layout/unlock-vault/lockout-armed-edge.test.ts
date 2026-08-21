import { didLockoutArm } from './lockout-armed-edge';

it('fires on the transition into a lockout', () => {
  expect(didLockoutArm(false, true)).toBe(true);
});

it('does not fire again while the lockout stays armed', () => {
  expect(didLockoutArm(true, true)).toBe(false);
});

it('does not fire when the lockout expires', () => {
  expect(didLockoutArm(true, false)).toBe(false);
});

it('does nothing while no lockout is in play', () => {
  expect(didLockoutArm(false, false)).toBe(false);
});
