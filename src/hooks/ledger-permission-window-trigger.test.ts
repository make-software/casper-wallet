import { LedgerEventStatus } from '@libs/services/ledger';

import {
  isLedgerPermissionWindowDocument,
  needsLedgerPermissionWindow
} from './ledger-permission-window-trigger';

describe('needsLedgerPermissionWindow', () => {
  it('asks for a window when USB has no permitted device yet', () => {
    expect(
      needsLedgerPermissionWindow({
        transport: 'USB',
        hasPermittedUsbDevice: false,
        isPermissionWindow: false
      })
    ).toBe(true);
  });

  it('connects inline when a USB device is already permitted', () => {
    expect(
      needsLedgerPermissionWindow({
        transport: 'USB',
        hasPermittedUsbDevice: true,
        isPermissionWindow: false
      })
    ).toBe(false);
  });

  it('never asks for a second window from inside the permission window', () => {
    expect(
      needsLedgerPermissionWindow({
        transport: 'USB',
        hasPermittedUsbDevice: false,
        isPermissionWindow: true
      })
    ).toBe(false);
    expect(
      needsLedgerPermissionWindow({
        transport: 'USB',
        hasPermittedUsbDevice: true,
        isPermissionWindow: true
      })
    ).toBe(false);
    expect(
      needsLedgerPermissionWindow({
        transport: 'Bluetooth',
        hasPermittedUsbDevice: false,
        isPermissionWindow: true
      })
    ).toBe(false);
  });

  it('always asks for a window for Bluetooth outside it', () => {
    expect(
      needsLedgerPermissionWindow({
        transport: 'Bluetooth',
        hasPermittedUsbDevice: false,
        isPermissionWindow: false
      })
    ).toBe(true);
    expect(
      needsLedgerPermissionWindow({
        transport: 'Bluetooth',
        hasPermittedUsbDevice: true,
        isPermissionWindow: false
      })
    ).toBe(true);
  });
});

describe('isLedgerPermissionWindowDocument', () => {
  it('is false for the opener', () => {
    expect(isLedgerPermissionWindowDocument('')).toBe(false);
  });

  it('is true for a document opened as the permission window', () => {
    expect(
      isLedgerPermissionWindowDocument(
        `?initialEventToRender=${LedgerEventStatus.LedgerAskPermission}`
      )
    ).toBe(true);
  });

  it('is true alongside the other permission-window params', () => {
    expect(
      isLedgerPermissionWindowDocument(
        `?requestId=abc&initialEventToRender=${LedgerEventStatus.LedgerAskPermission}&ledgerTransport=USB`
      )
    ).toBe(true);
  });

  it('does not take ledgerTransport as the witness', () => {
    expect(isLedgerPermissionWindowDocument('?ledgerTransport=USB')).toBe(
      false
    );
  });

  it('is false for any other initial status', () => {
    expect(
      isLedgerPermissionWindowDocument(
        `?initialEventToRender=${LedgerEventStatus.Disconnected}`
      )
    ).toBe(false);
  });
});
