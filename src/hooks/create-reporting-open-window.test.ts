import { WindowApp } from '@background/create-open-window';

import {
  clearUiError,
  reportUiError
} from '@libs/ui/components/saga-error-banner/ui-error-channel';

import { createReportingOpenWindow } from './create-reporting-open-window';

// `create-open-window` pulls the polyfill in for the `WindowApp` enum alone.
jest.mock('webextension-polyfill', () => ({
  windows: {},
  tabs: {}
}));

jest.mock('@libs/ui/components/saga-error-banner/ui-error-channel', () => ({
  reportUiError: jest.fn(),
  clearUiError: jest.fn()
}));

const reportUiErrorMock = reportUiError as jest.MockedFunction<
  typeof reportUiError
>;
const clearUiErrorMock = clearUiError as jest.MockedFunction<
  typeof clearUiError
>;

describe('createReportingOpenWindow', () => {
  let consoleError: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleError.mockRestore();
  });

  it('reports and logs nothing when the window opens', async () => {
    const open = jest.fn().mockResolvedValue({ reused: false });

    await createReportingOpenWindow(open)({
      windowApp: WindowApp.ImportAccount,
      isNewWindow: true
    });

    expect(reportUiErrorMock).not.toHaveBeenCalled();
    expect(consoleError).not.toHaveBeenCalled();
  });

  it('takes down the row left by an earlier failure once the window opens', async () => {
    const open = jest.fn().mockResolvedValue({ reused: false });

    await createReportingOpenWindow(open)({
      windowApp: WindowApp.ImportAccount,
      isNewWindow: true
    });

    expect(clearUiErrorMock).toHaveBeenCalledWith(
      'window-open-failed',
      WindowApp.ImportAccount
    );
  });

  it('resolves instead of rejecting when the open fails', async () => {
    const open = jest.fn().mockRejectedValue(new Error('no window'));

    await expect(
      createReportingOpenWindow(open)({
        windowApp: WindowApp.ImportAccount,
        isNewWindow: true
      })
    ).resolves.toBeUndefined();

    expect(reportUiErrorMock).toHaveBeenCalledWith(
      'window-open-failed',
      WindowApp.ImportAccount
    );
  });

  it('logs the error name only — never the rejection, never the props', async () => {
    // `searchParams` is embedded in the URL `windows.create` is given, and a
    // sign-message plaintext can ride there, so a rejection built from that URL
    // must not reach the console.
    const secret = 'plaintext-the-user-is-about-to-sign';
    const open = jest
      .fn()
      .mockRejectedValue(new TypeError(`failed to open ?message=${secret}`));

    await createReportingOpenWindow(open)({
      windowApp: WindowApp.SignatureRequestMessage,
      searchParams: { message: secret }
    });

    expect(consoleError).toHaveBeenCalledWith(
      'openWindow failed',
      WindowApp.SignatureRequestMessage,
      'TypeError'
    );
    expect(JSON.stringify(consoleError.mock.calls)).not.toContain(secret);
  });

  it('survives a rejection that is not an Error', async () => {
    const open = jest.fn().mockRejectedValue('just a string');

    await createReportingOpenWindow(open)({
      windowApp: WindowApp.ImportAccount
    });

    expect(consoleError).toHaveBeenCalledWith(
      'openWindow failed',
      WindowApp.ImportAccount,
      undefined
    );
    expect(reportUiErrorMock).toHaveBeenCalled();
  });
});
