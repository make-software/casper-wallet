import type {
  DeviceManagementKit,
  DiscoveredDevice,
  TransportIdentifier
} from '@ledgerhq/device-management-kit';
import { webBleIdentifier } from '@ledgerhq/device-transport-kit-web-ble';
import { webHidIdentifier } from '@ledgerhq/device-transport-kit-web-hid';
import { LedgerError, type TransportCreator } from 'casper-wallet-core';
import { type Subscription, firstValueFrom } from 'rxjs';

import {
  connectSession,
  getBluetoothAvailabilityDmk,
  getDmk,
  getUsbAvailabilityDmk
} from './dmk';
import {
  type DmkLedgerTransport,
  type DmkSessionHandle,
  createDmkLedgerTransport
} from './dmk-transport';
import { LedgerEventStatus, SelectedTransport } from './types';

export const IsUsbLedgerTransportAvailable = (
  dmk: Pick<
    DeviceManagementKit,
    'isEnvironmentSupported'
  > = getUsbAvailabilityDmk()
): Promise<boolean> => Promise.resolve(dmk.isEnvironmentSupported());

export const IsBluetoothLedgerTransportAvailable = (
  dmk: Pick<
    DeviceManagementKit,
    'isEnvironmentSupported'
  > = getBluetoothAvailabilityDmk()
): Promise<boolean> => Promise.resolve(dmk.isEnvironmentSupported());

/** The `navigator.bluetooth` surface this module needs; untyped in TS's DOM lib. */
interface BluetoothAvailabilitySource {
  getAvailability(): Promise<boolean>;
  addEventListener(
    type: 'availabilitychanged',
    listener: (event: { value: boolean }) => void
  ): void;
  removeEventListener(
    type: 'availabilitychanged',
    listener: (event: { value: boolean }) => void
  ): void;
}

const getRealBluetoothAvailabilitySource = ():
  BluetoothAvailabilitySource | undefined =>
  (navigator as unknown as { bluetooth?: BluetoothAvailabilitySource })
    .bluetooth;

/** Stands in for DMK, which has no bluetooth-availability observable, over `navigator.bluetooth`. */
export const subscribeToBluetoothAvailability = (
  observer: (available: boolean) => void,
  bluetooth:
    | BluetoothAvailabilitySource
    | undefined = getRealBluetoothAvailabilitySource()
): { unsubscribe: () => void } => {
  if (!bluetooth) {
    observer(false);
    return { unsubscribe: () => {} };
  }

  const handleChange = (event: { value: boolean }) => observer(event.value);

  bluetooth.getAvailability().then(observer, () => observer(false));
  bluetooth.addEventListener('availabilitychanged', handleChange);

  return {
    unsubscribe: () =>
      bluetooth.removeEventListener('availabilitychanged', handleChange)
  };
};

export const isTransportAvailable = async () => {
  try {
    return (
      await Promise.all([
        IsUsbLedgerTransportAvailable(),
        IsBluetoothLedgerTransportAvailable()
      ])
    ).some(Boolean);
  } catch {
    return false;
  }
};

type LedgerConnectDmk = Pick<
  DeviceManagementKit,
  'listenToAvailableDevices' | 'startDiscovering' | 'connect'
> &
  DmkSessionHandle;

export const KNOWN_DEVICES_WAIT_MS = 500;

/** Reads past the seeded emission, bounded by `KNOWN_DEVICES_WAIT_MS`; never prompts. */
function listPermittedDevices(
  dmk: Pick<DeviceManagementKit, 'listenToAvailableDevices'>,
  transport: TransportIdentifier
): Promise<DiscoveredDevice[]> {
  return new Promise(resolve => {
    let latest: DiscoveredDevice[] = [];
    let subscribing = true;
    let settled = false;
    const subscriptionRef: { current?: Subscription } = {};

    const finish = (devices: DiscoveredDevice[]) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      subscriptionRef.current?.unsubscribe();
      resolve(devices);
    };

    const timer = setTimeout(() => finish(latest), KNOWN_DEVICES_WAIT_MS);

    subscriptionRef.current = dmk
      .listenToAvailableDevices({ transport })
      .subscribe({
        next: devices => {
          latest = devices;
          if (!subscribing) finish(devices);
        },
        error: () => finish([])
      });

    subscribing = false;
  });
}

/**
 * Connects silently to an already-permitted device, falling back to the browser's device picker
 * when none is found, so callers must only invoke this from a user gesture.
 */
export async function connectLedgerTransport(
  dmk: LedgerConnectDmk,
  transport: TransportIdentifier
): Promise<DmkLedgerTransport> {
  const knownDevices = await listPermittedDevices(dmk, transport);

  const device =
    knownDevices[0] ??
    (await firstValueFrom(dmk.startDiscovering({ transport }), {
      defaultValue: undefined
    }));

  if (!device) {
    throw new LedgerError({
      status: LedgerEventStatus.LedgerPermissionRequired
    });
  }

  const sessionId = await connectSession(dmk, device);

  return createDmkLedgerTransport(dmk, sessionId);
}

export const usbTransportCreator: TransportCreator = () =>
  connectLedgerTransport(getDmk(), webHidIdentifier);

export const bluetoothTransportCreator: TransportCreator = () =>
  connectLedgerTransport(getDmk(), webBleIdentifier);

/** Answers "is a Ledger already permitted?" without prompting; USB only, as paired BLE cannot. */
export const getPreferredTransport = async (
  dmk: Pick<DeviceManagementKit, 'listenToAvailableDevices'> = getDmk()
): Promise<SelectedTransport> => {
  const devices = await listPermittedDevices(dmk, webHidIdentifier);

  return devices.length ? 'USB' : undefined;
};
