/**
 * True only on the transition into a lockout.
 *
 * Keyed on the edge rather than on `count >= limit && !lockout`: the background
 * arms the lockout in the same dispatch that increments the counter, so a
 * replica may never observe that intermediate condition and a derived check
 * would silently stop firing. The lockout screen unmounts the password field and
 * react-hook-form keeps values across unmount, so without this the wrong
 * password is still sitting there when the lockout expires — one click from
 * burning the next attempt.
 */
export function shouldClearPasswordField(
  wasLockedOut: boolean,
  isLockedOut: boolean
): boolean {
  return isLockedOut && !wasLockedOut;
}
