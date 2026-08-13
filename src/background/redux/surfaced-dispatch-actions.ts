import { ledgerNewWindowIdChanged } from './ledger/actions';
import { lockVault, openExportKeysWindow, resetVault } from './sagas/actions';
import { accountsImported } from './vault/actions';

// Which dropped dispatches the user is told about.
//
// The criterion for membership — and the only one: the dispatch IS the sole
// source of the visible result. If it never reaches the background, the user
// sees nothing happen and no other feedback path exists. Everything else stays
// log-only, because a banner on all ~105 dispatch sites (theme changes, banner
// dismissals) would train the user to ignore the banner.
//
// Built from the creators' `.type` so a rename is a compile error, and pinned by
// `surfaced-dispatch-actions.test.ts` so a change here is deliberate.
export const SURFACED_DISPATCH_ACTIONS: ReadonlySet<string> = new Set([
  // The menu closes and no export window ever appears.
  openExportKeysWindow.type,
  // The user pressed Lock and the wallet stayed unlocked — a security outcome,
  // not an inconvenience.
  lockVault.type,
  // The Ledger window never attaches to the request, which then hangs until the
  // dapp's own timeout (see attach-window-to-request.ts).
  ledgerNewWindowIdChanged.type,
  // Without this the reload presents an unperformed reset as done.
  resetVault.type,
  // Without this the navigation presents an unperformed import as done.
  accountsImported.type
]);
