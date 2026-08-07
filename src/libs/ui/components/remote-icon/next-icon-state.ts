export interface IconState {
  src?: string | null;
  hasError: boolean;
}

/**
 * RemoteIcon's rows are recycled across different tokens and contracts, so the
 * error latched by a failed <img> load must not survive onto a different
 * `src`. Hoisted out of the component's useEffect so both rules are
 * assertable without a DOM: a changed `src` clears `hasError`; an unchanged
 * `src` preserves whatever `hasError` already was (including one just set by
 * `onError`).
 */
export const nextIconState = (
  prev: IconState,
  next: { src?: string | null }
): IconState => {
  if (next.src === prev.src) {
    return prev;
  }

  return { src: next.src, hasError: false };
};
