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
  consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => consoleError.mockRestore());

it('registers the permission window against the request it displays', () => {
  registerLedgerPermissionWindow({
    domain: 'signature-request.html',
    requestId: 'r1',
    windowId: 9
  });

  expect(dispatchMock).toHaveBeenCalledWith(
    windowRequestWindowAttached({ requestId: 'r1', windowId: 9 })
  );
});

it('stays silent for the internal flow, which legitimately has no request', () => {
  // `import-account-from-ledger` passes `params: {}` — there is no dapp request
  // behind it and nothing to keep alive.
  registerLedgerPermissionWindow({
    domain: 'popup.html',
    requestId: undefined,
    windowId: 9
  });

  expect(dispatchMock).not.toHaveBeenCalled();
  expect(consoleError).not.toHaveBeenCalled();
});

it('reports a dapp-approval flow that arrived without a requestId', () => {
  // Skipping the attach here is the P0 coming back: `windowIds` stays
  // `[approvalWindow]`, and the next dapp request reusing that window cancels
  // this one while the user is confirming on the device. `params` is a plain
  // string record at the call sites, so this is indistinguishable from the
  // internal flow at runtime unless it is said out loud.
  registerLedgerPermissionWindow({
    domain: 'signature-request.html',
    requestId: undefined,
    windowId: 9
  });

  expect(dispatchMock).not.toHaveBeenCalled();
  expect(consoleError).toHaveBeenCalledWith(
    'useLedger: permission window not registered — no requestId on an approval flow',
    { domain: 'signature-request.html', windowId: 9 }
  );
});

it('treats an empty requestId as absent rather than attaching to it', () => {
  registerLedgerPermissionWindow({
    domain: 'signature-request.html',
    requestId: '',
    windowId: 9
  });

  expect(dispatchMock).not.toHaveBeenCalled();
  expect(consoleError).toHaveBeenCalled();
});
