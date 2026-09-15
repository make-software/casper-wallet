import { LedgerEventStatus, LedgerTransport } from '@libs/services/ledger';

export interface LedgerPermissionWindowInputs {
  transport: LedgerTransport;
  /** A Ledger already permitted to this origin and currently connected — `getPreferredTransport() === 'USB'`. */
  hasPermittedUsbDevice: boolean;
  isPermissionWindow: boolean;
}

/**
 * Whether the device chooser needs a browser window of its own before this
 * transport can be opened.
 *
 * The extension popup cannot host a WebHID, WebUSB or Web Bluetooth chooser,
 * which is what the permission window is for. This used to be discovered by
 * attempting the connection and reading `ledger-permission-required` off the
 * event stream — a status the shared core service no longer emits, because it
 * reports every transport-open failure as `ledger-error-opening-device`. Asking
 * up front also drops a doomed connect attempt from the happy path.
 *
 * Bluetooth always needs the window outside it: paired BLE devices cannot be
 * enumerated the way `navigator.hid.getDevices()` enumerates permitted ones, so
 * there is no witness that would let us skip it.
 */
export function needsLedgerPermissionWindow({
  transport,
  hasPermittedUsbDevice,
  isPermissionWindow
}: LedgerPermissionWindowInputs): boolean {
  if (isPermissionWindow) {
    return false;
  }

  return transport === 'Bluetooth' || !hasPermittedUsbDevice;
}

/**
 * Whether this document IS a Ledger permission window. `initialEventToRender`
 * is set on every permission-window URL and nowhere else.
 */
export function isLedgerPermissionWindowDocument(search: string): boolean {
  return (
    new URLSearchParams(search).get('initialEventToRender') ===
    LedgerEventStatus.LedgerAskPermission
  );
}
