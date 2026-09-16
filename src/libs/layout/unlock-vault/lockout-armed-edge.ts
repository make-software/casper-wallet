/**
 * True only on the transition into a lockout. Keyed on the edge rather than on
 * `count >= limit && !lockout`: the background arms the lockout in the same
 * dispatch that increments the counter, so a replica may never observe that
 * intermediate condition and a derived check would silently stop firing.
 */
export function didLockoutArm(wasLockedOut: boolean, isLockedOut: boolean) {
  return isLockedOut && !wasLockedOut;
}
