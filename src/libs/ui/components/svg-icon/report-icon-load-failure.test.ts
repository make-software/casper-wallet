import { reportIconLoadFailure } from './report-icon-load-failure';

describe('reportIconLoadFailure', () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalTestEnv = process.env.TEST_ENV;
  let consoleError: jest.SpyInstance;

  beforeEach(() => {
    consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleError.mockRestore();
    if (originalNodeEnv === undefined) {
      delete process.env.NODE_ENV;
    } else {
      process.env.NODE_ENV = originalNodeEnv;
    }
    if (originalTestEnv === undefined) {
      delete process.env.TEST_ENV;
    } else {
      process.env.TEST_ENV = originalTestEnv;
    }
  });

  // The dedupe set is module-level and therefore shared across this file, so
  // every case below owns a src no other case uses.

  it('reports the failed src and the reason behind it', () => {
    reportIconLoadFailure(
      'assets/icons/reported-once.svg',
      new Error('Not found')
    );

    expect(consoleError).toHaveBeenCalledTimes(1);
    expect(consoleError.mock.calls[0][0]).toContain(
      'assets/icons/reported-once.svg'
    );
    expect(consoleError.mock.calls[0][0]).toContain('Not found');
  });

  it('stays silent on a repeat failure of the same src', () => {
    reportIconLoadFailure('assets/icons/repeated.svg', new Error('Not found'));
    reportIconLoadFailure('assets/icons/repeated.svg', new Error('Not found'));
    reportIconLoadFailure('assets/icons/repeated.svg', new Error('Not found'));

    expect(consoleError).toHaveBeenCalledTimes(1);
  });

  it('still reports a different src after one has been reported', () => {
    reportIconLoadFailure('assets/icons/first.svg', new Error('Not found'));
    reportIconLoadFailure('assets/icons/second.svg', new Error('Not found'));

    expect(consoleError).toHaveBeenCalledTimes(2);
    expect(consoleError.mock.calls[1][0]).toContain('assets/icons/second.svg');
  });

  // e2e-tests/fixtures.ts fails the run on any console line starting with
  // '[SvgIcon]' — that gate belongs to assertLocalIconSrc, which catches a
  // non-bundled src reaching this component. A failed fetch is not a policy
  // violation, so this marker deliberately sits outside that prefix. Pinned
  // here so a later rename cannot silently re-arm the gate.
  it('uses a marker the e2e violation gate does not match', () => {
    reportIconLoadFailure('assets/icons/marker.svg', new Error('Not found'));

    const message: string = consoleError.mock.calls[0][0];

    expect(message.startsWith('[SvgIcon:load]')).toBe(true);
    expect(message.startsWith('[SvgIcon]')).toBe(false);
  });

  // Unlike assertLocalIconSrc, which is silent outside observed builds: this
  // is a runtime failure that otherwise only ever happens on a user's machine.
  it('stays ungated by build, unlike assertLocalIconSrc', () => {
    process.env.NODE_ENV = 'production';
    delete process.env.TEST_ENV;

    reportIconLoadFailure('assets/icons/in-prod.svg', new Error('Not found'));

    expect(consoleError).toHaveBeenCalledTimes(1);
  });
});
