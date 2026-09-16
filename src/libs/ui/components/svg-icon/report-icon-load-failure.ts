/**
 * react-inlinesvg logs nothing of its own on a failed fetch or parse. The marker
 * is deliberately not the `[SvgIcon]` prefix e2e fixtures fail the run on — that
 * gate belongs to assertLocalIconSrc.
 */

// react-inlinesvg caches successes only, so every mounted instance sharing a
// broken src refetches and fails again; one report per src is the whole signal.
const reportedSources = new Set<string>();

export const reportIconLoadFailure = (src: string, error: Error): void => {
  if (reportedSources.has(src)) {
    return;
  }

  reportedSources.add(src);

  console.error(`[SvgIcon:load] failed to inline "${src}": ${error.message}`);
};
