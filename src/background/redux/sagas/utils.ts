/**
 * Converts an unknown caught value into a user-facing error message.
 * Keeps `Error#message` where available; `String` alone renders a non-`Error`
 * throw as the unhelpful `"[object Object]"`.
 */
export const errorToMessage = (err: unknown): string =>
  err instanceof Error ? err.message : String(err);
