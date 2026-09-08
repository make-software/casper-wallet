import { isLedgerError, ledgerErrorsData } from './errors';
import { LedgerEventStatus } from './types';

describe('LedgerEventStatus', () => {
  it('keeps the wire values this extension emits and matches on', () => {
    expect(LedgerEventStatus.Disconnected).toBe('ledger-disconnected');
    expect(LedgerEventStatus.Connected).toBe('ledger-connected');
    expect(LedgerEventStatus.SignatureRequestedToUser).toBe(
      'ledger-signature-requested-to-user'
    );
    expect(LedgerEventStatus.SignatureCanceled).toBe(
      'ledger-signature-cancelled'
    );
    expect(LedgerEventStatus.MsgSignatureCanceled).toBe(
      'ledger-msg-signature-cancelled'
    );
    expect(LedgerEventStatus.LedgerPermissionRequired).toBe(
      'ledger-permission-required'
    );
    expect(LedgerEventStatus.PermissionWindowFailed).toBe(
      'ledger-permission-window-failed'
    );
    expect(LedgerEventStatus.TransactionForOldAppVersion).toBe(
      'ledger-transaction-for-old-app-version'
    );
  });

  it('has copy-map coverage for every status', () => {
    Object.values(LedgerEventStatus).forEach(status => {
      expect(ledgerErrorsData[status]).toBeDefined();
    });
  });

  it('treats the two mobile-only statuses as non-errors here', () => {
    expect(
      isLedgerError({ status: LedgerEventStatus.BleDeviceSelection })
    ).toBe(false);
    expect(
      isLedgerError({ status: LedgerEventStatus.BluetoothPairingInvalidated })
    ).toBe(false);
  });
});
