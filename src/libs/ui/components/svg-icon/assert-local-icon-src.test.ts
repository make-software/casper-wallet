import { assertLocalIconSrc } from './assert-local-icon-src';

describe('assertLocalIconSrc', () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalTestEnv = process.env.TEST_ENV;
  let consoleError: jest.SpyInstance;

  beforeEach(() => {
    consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleError.mockRestore();
    process.env.NODE_ENV = originalNodeEnv;
    if (originalTestEnv === undefined) {
      delete process.env.TEST_ENV;
    } else {
      process.env.TEST_ENV = originalTestEnv;
    }
  });

  it('reports a remote src with the [SvgIcon] marker the e2e fixture greps for', () => {
    process.env.NODE_ENV = 'development';

    assertLocalIconSrc('https://casper-assets.s3.amazonaws.com/a.svg');

    expect(consoleError).toHaveBeenCalledTimes(1);
    expect(consoleError.mock.calls[0][0]).toContain('[SvgIcon]');
    expect(consoleError.mock.calls[0][0]).toContain(
      'https://casper-assets.s3.amazonaws.com/a.svg'
    );
  });

  it('reports a shouted https prefix that hasHttpPrefix would have missed', () => {
    process.env.NODE_ENV = 'development';

    assertLocalIconSrc('HTTPS://example.com/a.svg');

    expect(consoleError).toHaveBeenCalledTimes(1);
    expect(consoleError.mock.calls[0][0]).toContain('[SvgIcon]');
  });

  it('reports a data: URI, which react-inlinesvg injects without any fetch', () => {
    process.env.NODE_ENV = 'development';

    assertLocalIconSrc('data:image/svg+xml,%3Csvg%3E%3C/svg%3E');

    expect(consoleError).toHaveBeenCalledTimes(1);
    expect(consoleError.mock.calls[0][0]).toContain('[SvgIcon]');
  });

  it('reports raw <svg> markup, which react-inlinesvg injects without any fetch', () => {
    process.env.NODE_ENV = 'development';

    assertLocalIconSrc('<svg onload="x"></svg>');

    expect(consoleError).toHaveBeenCalledTimes(1);
    expect(consoleError.mock.calls[0][0]).toContain('[SvgIcon]');
  });

  // The guard fires on whatever isBundledAssetPath rejects, so a predicate that
  // only checked the prefix left it silent on exactly this shape — a valid
  // `assets/` prefix with `<svg …>` smuggled into the remainder, which routes
  // to SvgIcon and gets inlined. The e2e [SvgIcon] marker could not catch it
  // either, for the same reason.
  it('reports markup smuggled into the remainder of a valid assets/ prefix', () => {
    process.env.NODE_ENV = 'development';

    assertLocalIconSrc('assets/<svg onload=1></svg>');

    expect(consoleError).toHaveBeenCalledTimes(1);
    expect(consoleError.mock.calls[0][0]).toContain('[SvgIcon]');
  });

  it('stays silent for bundled asset paths', () => {
    process.env.NODE_ENV = 'development';

    assertLocalIconSrc('assets/icons/generic.svg');
    assertLocalIconSrc('/assets/icons/casper.svg');

    expect(consoleError).not.toHaveBeenCalled();
  });

  it('reports an empty src, which is not a bundled asset path either', () => {
    process.env.NODE_ENV = 'development';

    assertLocalIconSrc('');

    expect(consoleError).toHaveBeenCalledTimes(1);
    expect(consoleError.mock.calls[0][0]).toContain('[SvgIcon]');
  });

  it('stays silent in a production build with no TEST_ENV', () => {
    process.env.NODE_ENV = 'production';
    delete process.env.TEST_ENV;

    assertLocalIconSrc('https://example.com/a.svg');

    expect(consoleError).not.toHaveBeenCalled();
  });

  it('still reports in the e2e build, which is production plus TEST_ENV', () => {
    process.env.NODE_ENV = 'production';
    process.env.TEST_ENV = 'true';

    assertLocalIconSrc('https://example.com/a.svg');

    expect(consoleError).toHaveBeenCalledTimes(1);
  });
});
