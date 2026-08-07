import { isBundledAssetPath } from '@src/utils';

/**
 * SvgIcon is react-inlinesvg: it injects markup straight into the DOM without
 * a fetch for a `data:image/svg+xml,…` src or any string containing `<svg`,
 * and otherwise fetches the file (connect-src + a host permission) before
 * inlining it. Icons coming from API responses must therefore go through
 * RemoteIcon instead — only bundled asset paths may reach SvgIcon.
 *
 * The `[SvgIcon]` prefix is what e2e-tests/fixtures.ts greps the page console
 * for, so a regression fails CI instead of surfacing as a missing icon in prod.
 * Silent in shipped builds: TEST_ENV is set only by the e2e build scripts.
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
