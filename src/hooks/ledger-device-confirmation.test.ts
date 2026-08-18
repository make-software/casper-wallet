import { dispatchToMainStore } from '@background/redux/utils';
import { windowRequestDeviceConfirmationChanged } from '@background/redux/windowManagement/actions';

import { runWithDeviceConfirmationReported } from './ledger-device-confirmation';

jest.mock('@background/redux/utils', () => ({
  dispatchToMainStore: jest.fn()
}));

const dispatchMock = dispatchToMainStore as jest.Mock;

let consoleError: jest.SpyInstance;

beforeEach(() => {
  jest.clearAllMocks();
  consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => consoleError.mockRestore());

it('brackets the device call with a start and an end', async () => {
  await runWithDeviceConfirmationReported('r1', async () => {
    expect(dispatchMock).toHaveBeenCalledTimes(1);
    expect(dispatchMock).toHaveBeenLastCalledWith(
      windowRequestDeviceConfirmationChanged({
        requestId: 'r1',
        awaiting: true
      })
    );
  });

  expect(dispatchMock).toHaveBeenLastCalledWith(
    windowRequestDeviceConfirmationChanged({
      requestId: 'r1',
      awaiting: false
    })
  );
});

// The flag withholds the shared approval window from every later request, so a
// device call that throws must still release it — otherwise one failed signing
// attempt makes every subsequent dapp request open a window of its own.
it('releases the window when the device call fails', async () => {
  await runWithDeviceConfirmationReported('r1', async () => {
    throw new Error('device says no');
  });

  expect(dispatchMock).toHaveBeenLastCalledWith(
    windowRequestDeviceConfirmationChanged({
      requestId: 'r1',
      awaiting: false
    })
  );
});

it('surfaces a failed device call instead of swallowing it', async () => {
  await runWithDeviceConfirmationReported('r1', async () => {
    throw new Error('device says no');
  });

  expect(consoleError).toHaveBeenCalledWith(
    'useLedger: the device action failed',
    { errorName: 'Error' }
  );
});

// `import-account-from-ledger`, transfer and staking run the same hook with no
// dapp request behind them: there is no descriptor to flag and no approval
// window to protect.
it('still runs the device call for an internal flow, reporting nothing', async () => {
  const run = jest.fn().mockResolvedValue(undefined);

  await runWithDeviceConfirmationReported(undefined, run);

  expect(run).toHaveBeenCalledTimes(1);
  expect(dispatchMock).not.toHaveBeenCalled();
});

it('treats an empty requestId as absent', async () => {
  await runWithDeviceConfirmationReported('', async () => {});

  expect(dispatchMock).not.toHaveBeenCalled();
});
