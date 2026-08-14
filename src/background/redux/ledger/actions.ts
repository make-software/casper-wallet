import { createAction } from '@reduxjs/toolkit';

export {
  ledgerDeployChanged,
  ledgerNewWindowIdChanged,
  ledgerRecipientToSaveOnSuccessChanged,
  ledgerStateCleared,
  ledgerTransactionChanged
} from './reducer';

/**
 * A command, not a state change — there is no reducer case for it. Dispatched
 * by `use-ledger` when a Ledger flow ends (signature completed, or the user
 * takes the abandon CTA) and intercepted in `handleReduxAction`.
 *
 * It exists because the UI cannot compute the answer: the windows this flow
 * owns are `ledger.windowId` plus `windowManagement.requests[requestId].windowIds`,
 * and `selectPopupState` strips `requests` from every replica on purpose. The
 * predecessor asked `windows.getAll({ windowTypes: ['popup'] })` instead and
 * closed every popup window in the profile — WALLET-1416.
 *
 * `requestId` is absent for the internal flows (`import-account-from-ledger`,
 * `sign-with-ledger-in-new-window`), which have no dapp request behind them;
 * those own the permission window and nothing else.
 *
 * `permissionWindowId` is the dispatcher's own window — one it opened, or the
 * one it renders in. `state.ledger.windowId` is a single global slot that a
 * second flow can take over, so it is not evidence of whose window it names.
 */
export const closeLedgerFlowWindows = createAction<{
  requestId?: string;
  permissionWindowId?: number;
}>('CLOSE_LEDGER_FLOW_WINDOWS');
