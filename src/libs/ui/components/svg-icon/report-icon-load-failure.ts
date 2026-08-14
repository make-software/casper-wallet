/**
 * SvgIcon is react-inlinesvg: on a failed fetch or parse it renders its
 * `children` (null unless supplied) and calls `onError`, and logs nothing of
 * its own — its only console.error calls are cache plumbing. Without this
 * report an icon that never arrived is indistinguishable from an icon that was
 * never asked for, in development and in production alike.
 *
 * The marker is `[SvgIcon:load]`, deliberately not `[SvgIcon]`:
 * e2e-tests/fixtures.ts fails the run on any console line starting with the
 * latter. That gate belongs to assertLocalIconSrc, which catches a non-bundled
 * src reaching this component — a security invariant. A failed network fetch
 * is not one, and sharing the prefix would make an unrelated CI failure read
 * as a security regression.
 *
 * Reports in every build, production included — unlike assertLocalIconSrc,
 * which enforces a development-time invariant and stays silent in shipped
 * builds. This one describes a runtime failure that otherwise surfaces only on
 * a user's machine.
 */

// react-inlinesvg caches successes only (CacheStore.isCached is true for
// STATUS.LOADED alone), so every mounted instance sharing a broken src
// refetches and fails again — twenty rows of a list would emit twenty
// identical lines. The repetition carries no information the first line
// doesn't, so one report per src is the whole signal.
const reportedSources = new Set<string>();

export const reportIconLoadFailure = (src: string, error: Error): void => {
  if (reportedSources.has(src)) {
    return;
  }

  reportedSources.add(src);

  console.error(`[SvgIcon:load] failed to inline "${src}": ${error.message}`);
};
