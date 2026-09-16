import { isLedgerError, isLedgerWaiting, ledgerErrorsData } from './errors';
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

  it('treats a locked device as a state the flow waits out, not a failure', () => {
    expect(isLedgerWaiting({ status: LedgerEventStatus.DeviceLocked })).toBe(
      true
    );
  });

  it('treats every other status with copy as a failure, not a wait', () => {
    [
      LedgerEventStatus.SignatureFailed,
      LedgerEventStatus.SignatureCanceled,
      LedgerEventStatus.CasperAppNotLoaded,
      LedgerEventStatus.NotAvailable,
      LedgerEventStatus.Timeout
    ].forEach(status => {
      expect(isLedgerWaiting({ status })).toBe(false);
    });
  });

  // The waiting screen is still rendered by the error view, so it has to report as one.
  it('keeps a locked device on the path that renders its copy', () => {
    expect(isLedgerError({ status: LedgerEventStatus.DeviceLocked })).toBe(
      true
    );
  });

  it('does not tell a locked device to start over', () => {
    const { description } = ledgerErrorsData[LedgerEventStatus.DeviceLocked];

    expect(description).not.toMatch(/try again/i);
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
