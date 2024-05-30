import { ILedgerEvent, LedgerEventStatus } from './types';

interface ILedgerErrorData {
  title: string | null;
  description: string | null;
}

export const ledgerErrorsData: Record<LedgerEventStatus, ILedgerErrorData> = {
  [LedgerEventStatus.Timeout]: {
    title: 'Connection timeout',
    description: 'The connection time is up, try again'
  },
  [LedgerEventStatus.InvalidIndex]: {
    title: 'Invalid account index',
    description:
      'Try to remove the current account from the extension and add it again'
  },
  [LedgerEventStatus.ErrorOpeningDevice]: {
    title: 'Unable to connect to the Ledger device',
    description: 'Check the Ledger device connection and try again'
  },
  [LedgerEventStatus.LedgerPermissionRequired]: {
    title: 'Please provide permission to connect your Ledger device',
    description:
      'This permission is needed for each new device when connecting to the browser.'
  },
  [LedgerEventStatus.MsgSignatureFailed]: {
    title: 'Error when signing a message',
    description: null
  },
  [LedgerEventStatus.MsgSignatureCanceled]: {
    title: 'You rejected to sign the message',
    description: null
  },
  [LedgerEventStatus.SignatureFailed]: {
    title: 'Error when signing a deploy',
    description: null
  },
  [LedgerEventStatus.SignatureCanceled]: {
    title: 'You rejected to sign the deploy',
    description: null
  },
  [LedgerEventStatus.AccountListFailed]: {
    title: 'Synchronization of accounts from the Ledger device failed',
    description: null
  },
  [LedgerEventStatus.CasperAppNotLoaded]: {
    title: 'Casper app isn’t open on Ledger',
    description:
      'Please make sure to open Casper app on your Ledger and try connecting again.'
  },
  [LedgerEventStatus.DeviceLocked]: {
    title: 'The Ledger device is locked',
    description: 'Unlock the Ledger device connection and try again'
  },
  [LedgerEventStatus.NotAvailable]: {
    title: "Your browser doesn't support connection to Ledger",
    description:
      'Consider switching to latest versions of Chrome or Edge browsers'
  },
  [LedgerEventStatus.WaitingToSignPrevDeploy]: {
    title: 'Your have pending signing action on your Ledger device',
    description: 'Handle the previous signing action and then make a new one'
  },
  'ledger-ask-permission': { title: null, description: null },
  'ledger-account-list-updated': { title: null, description: null },
  'ledger-connected': { title: null, description: null },
  'ledger-disconnected': { title: null, description: null },
  'ledger-loading-accounts-list': { title: null, description: null },
  'ledger-msg-signature-completed': { title: null, description: null },
  'ledger-msg-signature-requested-to-user': { title: null, description: null },
  'ledger-signature-completed': { title: null, description: null },
  'ledger-signature-requested-to-user': { title: null, description: null },
  'ledger-waiting-response-from-device': { title: null, description: null }
};

export const isLedgerError = (event: ILedgerEvent) =>
  Boolean(ledgerErrorsData[event.status].title);
