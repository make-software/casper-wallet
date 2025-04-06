export enum LedgerEventStatus {
  Disconnected = 'ledger-disconnected',
  NotAvailable = 'ledger-not-available',
  DeviceLocked = 'ledger-device-locked',
  WaitingResponseFromDevice = 'ledger-waiting-response-from-device',
  WaitingToSignPrevDeploy = 'waiting-to-sign-prev-deploy',
  CasperAppNotLoaded = 'ledger-casper-app-not-loaded',
  Connected = 'ledger-connected',
  LoadingAccountsList = 'ledger-loading-accounts-list',
  AccountListUpdated = 'ledger-account-list-updated',
  AccountListFailed = 'ledger-account-list-failed',
  SignatureRequestedToUser = 'ledger-signature-requested-to-user',
  SignatureCompleted = 'ledger-signature-completed',
  SignatureCanceled = 'ledger-signature-cancelled',
  SignatureFailed = 'ledger-signature-failed',
  MsgSignatureRequestedToUser = 'ledger-msg-signature-requested-to-user',
  MsgSignatureCompleted = 'ledger-msg-signature-completed',
  MsgSignatureCanceled = 'ledger-msg-signature-cancelled',
  MsgSignatureFailed = 'ledger-msg-signature-failed',
  LedgerPermissionRequired = 'ledger-permission-required',
  LedgerAskPermission = 'ledger-ask-permission',
  ErrorOpeningDevice = 'ledger-error-opening-device',
  Timeout = 'ledger-timeout',
  InvalidIndex = 'ledger-invalid-index',
  TransactionForOldAppVersion = 'ledger-transaction-for-old-app-version'
}

export interface LedgerAccount {
  publicKey: string;
  index: number;
}

export interface ILedgerEvent {
  status: LedgerEventStatus;
  publicKey?: string;
  firstAcctIndex?: number;
  accounts?: LedgerAccount[];
  txHash?: string;
  error?: string;
  message?: string;
  msgHash?: string;
  signatureHex?: string;
}

export interface LedgerAccountsOptions {
  size: number;
  offset: number;
}

export interface SignResult {
  signatureHex: string;
  signature: Uint8Array;
  prefixedSignatureHex: string;
  prefixedSignature: Uint8Array;
}

export type LedgerTransport = 'USB' | 'Bluetooth';
export type SelectedTransport = LedgerTransport | undefined;
