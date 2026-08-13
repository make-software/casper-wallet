import { dismissSagaError } from './app-events/actions';
import { ledgerNewWindowIdChanged } from './ledger/actions';
import { lockVault, openExportKeysWindow, resetVault } from './sagas/actions';
import { SURFACED_DISPATCH_ACTIONS } from './surfaced-dispatch-actions';
import { accountImported, accountsImported } from './vault/actions';

describe('SURFACED_DISPATCH_ACTIONS', () => {
  // A pin, not a tautology: the list decides which dropped dispatches the user
  // is told about, and the criterion for adding one is a judgement call. Growing
  // or shrinking it has to be a deliberate edit, not a side effect.
  it('contains exactly the seven actions whose dropped dispatch is otherwise invisible', () => {
    expect([...SURFACED_DISPATCH_ACTIONS].sort()).toEqual(
      [
        openExportKeysWindow.type,
        lockVault.type,
        ledgerNewWindowIdChanged.type,
        resetVault.type,
        accountsImported.type,
        accountImported.type,
        dismissSagaError.type
      ].sort()
    );
  });

  it('is keyed on the creators, so a rename cannot silently drop an entry', () => {
    expect(SURFACED_DISPATCH_ACTIONS.has(openExportKeysWindow.type)).toBe(true);
    expect(SURFACED_DISPATCH_ACTIONS.has(lockVault.type)).toBe(true);
  });
});
