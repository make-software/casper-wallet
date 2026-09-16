const MAX_LOGGED_ERROR_LENGTH = 200;

// Everything from the first `?` onward is dropped: that is where a window URL
// carries its search params, and for `signMessage` one is the plaintext message.
export function redactUrlQuery(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);

  return message.split('?')[0].slice(0, MAX_LOGGED_ERROR_LENGTH);
}
