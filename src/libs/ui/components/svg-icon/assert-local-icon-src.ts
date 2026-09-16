import { isBundledAssetPath } from '@src/utils';

/**
 * SvgIcon injects a `data:image/svg+xml,…` src or any string containing `<svg`
 * into the DOM with no fetch, so only bundled paths may reach it — API-supplied
 * icons go through RemoteIcon. `[SvgIcon]` is the prefix e2e fixtures grep for.
 */
export const assertLocalIconSrc = (src: string): void => {
  const isObservedBuild =
    process.env.NODE_ENV !== 'production' || Boolean(process.env.TEST_ENV);

  if (!isObservedBuild || isBundledAssetPath(src)) {
    return;
  }

  console.error(
    `[SvgIcon] non-bundled src "${src}" must be rendered with RemoteIcon — ` +
      `SvgIcon inlines data: URIs and raw <svg> markup straight into the DOM with no connect-src gate`
  );
};
