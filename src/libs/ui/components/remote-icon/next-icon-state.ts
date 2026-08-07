/**
 * The two events that can change RemoteIcon's `hasError` flag.
 *
 * `srcChanged` corresponds to the component's `useEffect(() => ..., [src])`
 * firing — React's own dependency-array comparison already guarantees that
 * only happens when `src` genuinely changed, so this function does not
 * re-derive that comparison itself. An earlier version carried a copy of
 * `src` in state purely to re-check "did it change," which meant the
 * changed-src branch had to allocate a fresh state object on every src
 * change — even the common case where `hasError` was already `false` — so
 * `useState`'s primitive-value bailout never kicked in and every ordinary
 * icon-src change forced an extra render. Reducing this to a boolean-only
 * transition removes the allocation and restores that bailout: both
 * `srcChanged` and `loadError` return a plain `boolean`, so `setHasError`
 * bails out via `Object.is` exactly when the pre-refactor
 * `setHasError(false)` / `setHasError(true)` calls did.
 *
 * What is, and isn't, tested by this function: "a load error sets
 * `hasError`" and "a genuine src change clears it" are real per-event rules
 * and are asserted below. "An unchanged `src` preserves `hasError`" is
 * *not* one of this function's branches — there is no `srcUnchanged` event —
 * because that guarantee comes from `useEffect`'s dependency array not
 * invoking this function at all, which is React's contract, not this
 * module's.
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
