import { dispatchToMainStore } from '@background/redux/utils';
import { windowRequestWindowAttached } from '@background/redux/windowManagement/actions';

import { registerLedgerPermissionWindow } from './register-ledger-permission-window';

jest.mock('@background/redux/utils', () => ({
  dispatchToMainStore: jest.fn()
}));

const dispatchMock = dispatchToMainStore as jest.Mock;

let consoleError: jest.SpyInstance;

beforeEach(() => {
  jest.clearAllMocks();
  dispatchMock.mockResolvedValue(true);
  consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => consoleError.mockRestore());

it('registers the permission window against the request it displays', async () => {
  const attached = registerLedgerPermissionWindow({
    domain: 'signature-request.html',
    requestId: 'r1',
    windowId: 9
  });

  expect(dispatchMock).toHaveBeenCalledWith(
    windowRequestWindowAttached({ requestId: 'r1', windowId: 9 })
  );
  await expect(attached).resolves.toBe(true);
});

it('reports the attach as not landed when the background never acknowledged it', async () => {
  dispatchMock.mockResolvedValue(false);

  await expect(
    registerLedgerPermissionWindow({
      domain: 'signature-request.html',
      requestId: 'r1',
      windowId: 9
    })
  ).resolves.toBe(false);
});

it('stays silent for the internal flow, which legitimately has no request', async () => {
  // `import-account-from-ledger` passes `params: {}` — there is no dapp request
  // behind it and nothing to keep alive.
  await expect(
    registerLedgerPermissionWindow({
      domain: 'popup.html',
      requestId: undefined,
      windowId: 9
    })
  ).resolves.toBe(false);

  expect(dispatchMock).not.toHaveBeenCalled();
  expect(consoleError).not.toHaveBeenCalled();
});

it('reports a dapp-approval flow that arrived without a requestId', async () => {
  // Skipping the attach here is the P0 coming back: `windowIds` stays
  // `[approvalWindow]`, and the next dapp request reusing that window cancels
  // this one while the user is confirming on the device. `params` is a plain
  // string record at the call sites, so this is indistinguishable from the
  // internal flow at runtime unless it is said out loud.
  await expect(
    registerLedgerPermissionWindow({
      domain: 'signature-request.html',
      requestId: undefined,
      windowId: 9
    })
  ).resolves.toBe(false);

  expect(dispatchMock).not.toHaveBeenCalled();
  expect(consoleError).toHaveBeenCalledWith(
    'useLedger: permission window not registered — no requestId on an approval flow',
    { domain: 'signature-request.html', windowId: 9 }
  );
});

it('treats an empty requestId as absent rather than attaching to it', async () => {
  await expect(
    registerLedgerPermissionWindow({
      domain: 'signature-request.html',
      requestId: '',
      windowId: 9
    })
  ).resolves.toBe(false);

  expect(dispatchMock).not.toHaveBeenCalled();
  expect(consoleError).toHaveBeenCalled();
});
