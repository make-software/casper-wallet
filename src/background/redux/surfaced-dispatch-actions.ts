import { dismissSagaError } from './app-events/actions';
import { ledgerNewWindowIdChanged } from './ledger/actions';
import {
  initKeys,
  initVault,
  lockVault,
  openExportKeysWindow,
  resetVault
} from './sagas/actions';
import { accountImported, accountsImported } from './vault/actions';
import { windowRequestWindowAttached } from './windowManagement/actions';

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
  // The Ledger permission window never attaches to the request, which then hangs
  // until the dapp's own timeout (see attach-window-to-request.ts).
  windowRequestWindowAttached.type,
  // Its sibling, and a separate send: without it `windowId` stays null, the
  // close tracker detaches and the permission window is never closed when the
  // signature completes. `triggeredRef` is set regardless of either outcome, so
  // neither has a retry path.
  ledgerNewWindowIdChanged.type,
  // Without this the reload presents an unperformed reset as done.
  resetVault.type,
  // Onboarding's two writes. Without `initKeys` the password screen keeps
  // rendering and nothing happens; without `initVault` the success screen
  // renders over a vault that was never created.
  initKeys.type,
  initVault.type,
  // Without these the navigation presents an unperformed import as done —
  // `accountsImported` from the Ledger flow, `accountImported` from the
  // secret-key-file and Torus flows.
  accountsImported.type,
  accountImported.type,
  // The banner's own dismiss button. Without this, pressing × while the
  // transport is down does nothing and says nothing; with it, the reason
  // appears as one deduped row whose own × is local and always works.
  dismissSagaError.type
]);
