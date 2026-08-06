import { hasHttpPrefix } from '@src/utils';

/**
 * SvgIcon is react-inlinesvg: it fetches the file (connect-src + a host
 * permission) and injects it into the DOM (a third-party <style> inside would
 * apply document-wide). Icons coming from API responses must therefore go
 * through RemoteIcon instead.
 *
 * The `[SvgIcon]` prefix is what e2e-tests/fixtures.ts greps the page console
 * for, so a regression fails CI instead of surfacing as a missing icon in prod.
 * Silent in shipped builds: TEST_ENV is set only by the e2e build scripts.
 */
export const assertLocalIconSrc = (src: string): void => {
  const isObservedBuild =
    process.env.NODE_ENV !== 'production' || Boolean(process.env.TEST_ENV);

  if (!isObservedBuild || !hasHttpPrefix(src)) {
    return;
  }

  console.error(
    `[SvgIcon] remote src "${src}" must be rendered with RemoteIcon — ` +
      `inlining a remote svg requires a connect-src entry and injects third-party markup into the DOM`
  );
};
