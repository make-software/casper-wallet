import { DeviceStatus } from '@ledgerhq/device-management-kit';
import type { DeviceSessionState } from '@ledgerhq/device-management-kit';
import type { LedgerDeviceState, LedgerDeviceStatus } from 'casper-wallet-core';

const STATUS: Record<string, LedgerDeviceStatus> = {
  [DeviceStatus.LOCKED]: 'locked',
  [DeviceStatus.BUSY]: 'busy',
  [DeviceStatus.CONNECTED]: 'connected',
  [DeviceStatus.NOT_CONNECTED]: 'disconnected'
};

const toStatus = (deviceStatus: string): LedgerDeviceStatus =>
  STATUS[deviceStatus] ?? 'unknown';

const readApp = (state: DeviceSessionState): LedgerDeviceState['app'] => {
  const currentApp = 'currentApp' in state ? state.currentApp : undefined;

  return currentApp?.name
    ? { name: currentApp.name, version: currentApp.version }
    : undefined;
};

/**
 * Translates a device session's state into the vocabulary core speaks. The only function in
 * this repository aware of both. A missing `app` means "ask the device", so a blank name is
 * omitted rather than passed through.
 */
export function toLedgerDeviceState(
  state: DeviceSessionState
): LedgerDeviceState {
  const app = readApp(state);

  return app
    ? { status: toStatus(state.deviceStatus), app }
    : { status: toStatus(state.deviceStatus) };
}
