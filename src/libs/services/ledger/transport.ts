import { ledgerUSBVendorId } from '@ledgerhq/devices';
import Transport from '@ledgerhq/hw-transport';
import BluetoothTransport from '@ledgerhq/hw-transport-web-ble';
import TransportWebHID from '@ledgerhq/hw-transport-webhid';
import TransportWebUsb from '@ledgerhq/hw-transport-webusb';
import { getLedgerDevices } from '@ledgerhq/hw-transport-webusb/lib/webusb';

import { LedgerError } from '@libs/services/ledger/ledger';

import { LedgerEventStatus, SelectedTransport } from './types';

export const IsUsbLedgerTransportAvailable = async (): Promise<boolean> => {
  const hidAvailable = await TransportWebHID.isSupported();

  if (hidAvailable) {
    return true;
  }

  return await TransportWebUsb.isSupported();
};

export const IsBluetoothLedgerTransportAvailable = async (): Promise<boolean> =>
  BluetoothTransport.isSupported();

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

export const usbTransportCreator = async (): Promise<Transport> => {
  if (await TransportWebHID.isSupported()) {
    const connected = await TransportWebHID.openConnected();

    return connected || (await TransportWebHID.request());
  } else if (await TransportWebUsb.isSupported()) {
    const connected = await TransportWebUsb.openConnected();

    if (!connected) {
      throw new LedgerError({
        status: LedgerEventStatus.LedgerPermissionRequired
      });
    }

    return connected || (await TransportWebUsb.request());
  } else {
    throw new Error('Usb connection not supported');
  }
};

export const bluetoothTransportCreator = async () =>
  BluetoothTransport.create();

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
