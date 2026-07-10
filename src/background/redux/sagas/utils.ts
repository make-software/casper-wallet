/**
 * Converts an unknown caught value into a user-facing error message.
 *
 * `String(err)` on a non-`Error` throw (e.g. a plain object) renders the
 * unhelpful `"[object Object]"`; this keeps the `Error#message` when available
 * and only falls back to `String` otherwise.
 */
export const errorToMessage = (err: unknown): string =>
  err instanceof Error ? err.message : String(err);
