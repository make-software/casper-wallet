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

  it('stays silent for bundled asset paths', () => {
    process.env.NODE_ENV = 'development';

    assertLocalIconSrc('assets/icons/generic.svg');
    assertLocalIconSrc('/assets/icons/casper.svg');
    assertLocalIconSrc('');

    expect(consoleError).not.toHaveBeenCalled();
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
