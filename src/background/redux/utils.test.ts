import { runtime } from 'webextension-polyfill';

import { reportUiError } from '@libs/ui/components/saga-error-banner/ui-error-channel';

import { lockVault } from './sagas/actions';
import { themeModeSettingChanged } from './settings/actions';
import { ThemeMode } from './settings/types';
import { dispatchToMainStore } from './utils';

jest.mock('webextension-polyfill', () => ({
  runtime: { sendMessage: jest.fn() }
}));

jest.mock('@libs/ui/components/saga-error-banner/ui-error-channel', () => ({
  reportUiError: jest.fn()
}));

const sendMessageMock = runtime.sendMessage as jest.MockedFunction<
  typeof runtime.sendMessage
>;
const reportUiErrorMock = reportUiError as jest.MockedFunction<
  typeof reportUiError
>;

describe('dispatchToMainStore', () => {
  let consoleError: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleError.mockRestore();
  });

  it('resolves true and reports nothing when the background answers', async () => {
    sendMessageMock.mockResolvedValue(undefined);

    await expect(dispatchToMainStore(lockVault())).resolves.toBe(true);

    expect(reportUiErrorMock).not.toHaveBeenCalled();
    expect(consoleError).not.toHaveBeenCalled();
  });

  it('resolves false instead of rejecting when the send fails', async () => {
    // 105 call sites do not catch. Rejecting here would turn each of them into
    // an unhandled rejection.
    sendMessageMock.mockRejectedValue(new Error('no receiving end'));

    await expect(dispatchToMainStore(lockVault())).resolves.toBe(false);
  });

  it('logs the type and the cause, never the action', async () => {
    sendMessageMock.mockRejectedValue(new Error('no receiving end'));

    await dispatchToMainStore(lockVault());

    expect(consoleError).toHaveBeenCalledWith(
      'Dispatch to Main Store failed: ' + lockVault().type,
      expect.any(Error)
    );
  });

  it('surfaces an allow-listed action to the user', async () => {
    sendMessageMock.mockRejectedValue(new Error('no receiving end'));

    await dispatchToMainStore(lockVault());

    expect(reportUiErrorMock).toHaveBeenCalledWith(
      'dispatch-failed',
      lockVault().type
    );
  });

  it('logs but does not surface an action that is not allow-listed', async () => {
    // A dropped theme change is not worth a banner; the log still records it.
    sendMessageMock.mockRejectedValue(new Error('no receiving end'));

    await dispatchToMainStore(themeModeSettingChanged(ThemeMode.LIGHT));

    expect(consoleError).toHaveBeenCalled();
    expect(reportUiErrorMock).not.toHaveBeenCalled();
  });
});
