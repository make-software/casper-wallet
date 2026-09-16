import { dismissSagaError } from './app-events/actions';
import { ledgerNewWindowIdChanged } from './ledger/actions';
import {
  changePassword,
  initKeys,
  initVault,
  lockVault,
  openExportKeysWindow,
  recoverVault,
  resetVault
} from './sagas/actions';
import { accountImported, accountsImported } from './vault/actions';
import { windowRequestWindowAttached } from './windowManagement/actions';

// Dropped dispatches the user is told about. Membership means the dispatch is
// the sole source of the visible result; everything else stays log-only.
export const SURFACED_DISPATCH_ACTIONS: ReadonlySet<string> = new Set([
  openExportKeysWindow.type,
  lockVault.type,
  // Reported by the change-password page directly, not through
  // `dispatchToMainStore`; listed so this set covers every banner.
  changePassword.type,
  windowRequestWindowAttached.type,
  ledgerNewWindowIdChanged.type,
  resetVault.type,
  initKeys.type,
  initVault.type,
  recoverVault.type,
  accountsImported.type,
  accountImported.type,
  dismissSagaError.type
]);
