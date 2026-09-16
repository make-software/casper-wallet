/**
 * The two events that can change RemoteIcon's `hasError`. `srcChanged` is the `[src]`
 * effect firing: React's dependency array, not this module, decides when src changed.
 */
export type IconErrorEvent = { type: 'srcChanged' } | { type: 'loadError' };

export const nextHasError = (
  hasError: boolean,
  event: IconErrorEvent
): boolean => {
  switch (event.type) {
    case 'srcChanged':
      return false;
    case 'loadError':
      return true;
  }
};
