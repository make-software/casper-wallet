import type {
  DeviceManagementKit,
  DiscoveredDevice,
  TransportIdentifier
} from '@ledgerhq/device-management-kit';
import { webBleIdentifier } from '@ledgerhq/device-transport-kit-web-ble';
import { webHidIdentifier } from '@ledgerhq/device-transport-kit-web-hid';
import { ledgerUSBVendorId } from '@ledgerhq/devices';
import BluetoothTransport from '@ledgerhq/hw-transport-web-ble';
import TransportWebHID from '@ledgerhq/hw-transport-webhid';
import TransportWebUsb from '@ledgerhq/hw-transport-webusb';
import { getLedgerDevices } from '@ledgerhq/hw-transport-webusb/lib/webusb';
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

export const subscribeToBluetoothAvailability =
  BluetoothTransport.observeAvailability;

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

/**
 * Bounds how long {@link listPermittedDevices} waits for a real device-list read. Shared with
 * Task 5's `getPreferredTransport`, which reuses the same helper.
 */
export const KNOWN_DEVICES_WAIT_MS = 500;

/**
 * Ignores the transport's synchronous seeded emission (e.g. WebHID's empty `BehaviorSubject`)
 * and waits for the first real read, bounded by `KNOWN_DEVICES_WAIT_MS` so a stalled or erroring
 * observable still resolves empty rather than hanging. Never calls `startDiscovering`.
 */
export function listPermittedDevices(
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
 * Connects silently to an already-permitted device (`listenToAvailableDevices`); only falls
 * back to the browser's device picker (`startDiscovering`) when none is found, so callers must
 * only invoke this from a user gesture. Throws `LedgerPermissionRequired` when neither yields a
 * device, so `use-ledger.ts` can distinguish that from a device-side connection failure.
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

export const getPreferredTransport = async (): Promise<SelectedTransport> => {
  if (await TransportWebHID.isSupported()) {
    // Copy from TransportWebHID.getLedgerDevices source code
    const getHID = (): null | Record<'getDevices', () => Promise<any[]>> => {
      // @ts-ignore
      const { hid } = navigator;

      if (!hid) return null;

      return hid;
    };

    async function getHiDLedgerDevices(): Promise<any[]> {
      const devices = (await getHID()?.getDevices()) ?? [];

      return devices.filter((d: any) => d.vendorId === ledgerUSBVendorId);
    }

    const devices = await getHiDLedgerDevices();

    if (devices.length) {
      return 'USB';
    }
  } else if (await TransportWebUsb.isSupported()) {
    const devices = await getLedgerDevices();

    if (devices.length) {
      return 'USB';
    }
  }

  return undefined;
};
