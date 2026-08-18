import { dismissSagaError } from './app-events/actions';
import { ledgerNewWindowIdChanged } from './ledger/actions';
import {
  initKeys,
  initVault,
  lockVault,
  openExportKeysWindow,
  recoverVault,
  resetVault
} from './sagas/actions';
import { SURFACED_DISPATCH_ACTIONS } from './surfaced-dispatch-actions';
import { accountImported, accountsImported } from './vault/actions';
import { windowRequestWindowAttached } from './windowManagement/actions';

describe('SURFACED_DISPATCH_ACTIONS', () => {
  // A pin, not a tautology: the list decides which dropped dispatches the user
  // is told about, and the criterion for adding one is a judgement call. Growing
  // or shrinking it has to be a deliberate edit, not a side effect.
  it('contains exactly the actions whose dropped dispatch is otherwise invisible', () => {
    expect([...SURFACED_DISPATCH_ACTIONS].sort()).toEqual(
      [
        openExportKeysWindow.type,
        lockVault.type,
        windowRequestWindowAttached.type,
        ledgerNewWindowIdChanged.type,
        resetVault.type,
        initKeys.type,
        initVault.type,
        recoverVault.type,
        accountsImported.type,
        accountImported.type,
        dismissSagaError.type
      ].sort()
    );
  });

  // The pin above cannot see a rename: both sides read the same creators, so a
  // renamed slice reducer moves them together. These literals are the only thing
  // in the file that does not come from a creator.
  it('pins the type strings themselves, which the creator-derived pin cannot', () => {
    expect([...SURFACED_DISPATCH_ACTIONS].sort()).toEqual(
      [
        'OPEN_EXPORT_KEYS_WINDOW_SAGA',
        'LOCK_VAULT_SAGA',
        'windowManagement/windowRequestWindowAttached',
        'ledger/ledgerNewWindowIdChanged',
        'RESET_VAULT_SAGA',
        'INIT_KEYS_SAGA',
        'INIT_VAULT_SAGA',
        'RECOVER_VAULT_SAGA',
        'vault/accountsImported',
        'vault/accountImported',
        'appEvents/dismissSagaError'
      ].sort()
    );
  });
});
