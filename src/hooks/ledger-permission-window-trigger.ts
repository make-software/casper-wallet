import { LedgerEventStatus, LedgerTransport } from '@libs/services/ledger';

export interface LedgerPermissionWindowInputs {
  transport: LedgerTransport;
  /** A Ledger already permitted to this origin and currently connected — `getPreferredTransport() === 'USB'`. */
  hasPermittedUsbDevice: boolean;
  isPermissionWindow: boolean;
}

/**
 * Whether the device chooser needs a browser window of its own before this
 * transport can be opened: the extension popup cannot host a WebHID, WebUSB or
 * Web Bluetooth chooser. Bluetooth always needs one, since paired BLE devices
 * cannot be enumerated the way `navigator.hid.getDevices()` enumerates permitted ones.
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
