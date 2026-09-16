import {
  type DeviceManagementKit,
  DeviceManagementKitBuilder,
  type DeviceSessionId,
  type DiscoveredDevice
} from '@ledgerhq/device-management-kit';
import { webBleTransportFactory } from '@ledgerhq/device-transport-kit-web-ble';
import { webHidTransportFactory } from '@ledgerhq/device-transport-kit-web-hid';

let dmk: DeviceManagementKit | undefined;

/** Built once per document, so every connection shares one instance and session registry. */
export const getDmk = (): DeviceManagementKit =>
  (dmk ??= new DeviceManagementKitBuilder()
    .addTransport(webHidTransportFactory)
    .addTransport(webBleTransportFactory)
    .build());

let usbAvailabilityDmk: DeviceManagementKit | undefined;

/** `isEnvironmentSupported` answers for any registered transport, so USB needs its own instance. */
export const getUsbAvailabilityDmk = (): DeviceManagementKit =>
  (usbAvailabilityDmk ??= new DeviceManagementKitBuilder()
    .addTransport(webHidTransportFactory)
    .build());

let bluetoothAvailabilityDmk: DeviceManagementKit | undefined;

export const getBluetoothAvailabilityDmk = (): DeviceManagementKit =>
  (bluetoothAvailabilityDmk ??= new DeviceManagementKitBuilder()
    .addTransport(webBleTransportFactory)
    .build());

/** The refresher is left enabled here; the transport gates it to observed, non-exchange spans. */
export const connectSession = (
  dmk: Pick<DeviceManagementKit, 'connect'>,
  device: DiscoveredDevice
): Promise<DeviceSessionId> =>
  dmk.connect({
    device,
    sessionRefresherOptions: { isRefresherDisabled: false }
  });
