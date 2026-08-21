/**
 * True only on the transition into a lockout.
 *
 * Keyed on the edge rather than on `count >= limit && !lockout`: the background
 * arms the lockout in the same dispatch that increments the counter, so a
 * replica may never observe that intermediate condition and a derived check
 * would silently stop firing.
 *
 * Two things hang off this edge. The lockout screen unmounts the password field
 * and react-hook-form keeps values across unmount, so without a reset the wrong
 * password is still sitting there when the lockout expires — one click from
 * burning the next attempt. And a submit already in flight when the lockout
 * arms is refused by `unlockVaultSaga`, which answers with a banner and nothing
 * the page listens to, so its spinner has to be cleared here or it never stops.
 */
export function didLockoutArm(wasLockedOut: boolean, isLockedOut: boolean) {
  return isLockedOut && !wasLockedOut;
}
