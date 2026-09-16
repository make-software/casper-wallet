import { createAction } from '@reduxjs/toolkit';

export {
  ledgerDeployChanged,
  ledgerNewWindowIdChanged,
  ledgerRecipientToSaveOnSuccessChanged,
  ledgerStateCleared,
  ledgerSwapPayloadChanged,
  ledgerTransactionChanged
} from './reducer';

/**
 * A command, not a state change — `handleReduxAction` intercepts it when a Ledger
 * flow ends. The UI cannot compute which windows the flow owns, since replicas get
 * no `requests`. `permissionWindowId` is the dispatcher's ownership proof, without
 * which the background drops the message; `requestId` is absent for internal flows.
 */
export const closeLedgerFlowWindows = createAction<{
  requestId?: string;
  permissionWindowId: number;
}>('CLOSE_LEDGER_FLOW_WINDOWS');
