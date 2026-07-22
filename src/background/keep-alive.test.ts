import { alarms, runtime } from 'webextension-polyfill';

import { startKeepAlive, stopKeepAlive } from '@background/keep-alive';

jest.mock('webextension-polyfill', () => ({
  alarms: {
    create: jest.fn(),
    clear: jest.fn(),
    onAlarm: {
      addListener: jest.fn()
    }
  },
  runtime: {
    sendMessage: jest.fn().mockResolvedValue(undefined)
  }
}));

jest.mock('@src/utils', () => ({
  isChromeBuild: true
}));

jest.mock('@background/redux/get-main-store', () => ({
  getExistingMainStoreSingletonOrInit: jest.fn()
}));

jest.mock('@background/redux/keys/selectors', () => ({
  selectKeysDoesExist: jest.fn()
}));

jest.mock('@background/redux/session/selectors', () => ({
  selectVaultIsLocked: jest.fn()
}));

jest.mock('@background/redux/vault-cipher/selectors', () => ({
  selectVaultCipherDoesExist: jest.fn()
}));

const mockAlarmsCreate = alarms.create as jest.Mock;
const mockAlarmsClear = alarms.clear as jest.Mock;
const mockAlarmsOnAlarmAddListener = alarms.onAlarm.addListener as jest.Mock;
const mockRuntimeSendMessage = runtime.sendMessage as jest.Mock;

beforeAll(() => {
  jest.spyOn(console, 'log').mockImplementation(() => undefined);
  jest.spyOn(console, 'error').mockImplementation(() => undefined);
});

afterAll(() => {
  (console.log as jest.Mock).mockRestore();
  (console.error as jest.Mock).mockRestore();
});

const flushPromises = () => new Promise(resolve => setImmediate(resolve));

describe('keep-alive', () => {
  beforeEach(() => {
    mockAlarmsCreate.mockClear();
    mockAlarmsClear.mockClear();
    mockRuntimeSendMessage.mockClear();
    mockRuntimeSendMessage.mockResolvedValue(undefined);
    (console.error as jest.Mock).mockClear();
  });

  it('startKeepAlive creates the casper-keep-alive alarm with a 0.5 minute period', () => {
    startKeepAlive();

    expect(mockAlarmsCreate).toHaveBeenCalledWith('casper-keep-alive', {
      periodInMinutes: 0.5
    });
  });

  it('stopKeepAlive clears the casper-keep-alive alarm', () => {
    stopKeepAlive();

    expect(mockAlarmsClear).toHaveBeenCalledWith('casper-keep-alive');
  });

  it('registers an alarms.onAlarm listener at module load time', () => {
    expect(mockAlarmsOnAlarmAddListener).toHaveBeenCalledWith(
      expect.any(Function)
    );
  });

  it('the registered onAlarm listener triggers the keepAlive ping only for the casper-keep-alive alarm', () => {
    const listener = mockAlarmsOnAlarmAddListener.mock.calls[0][0];

    listener({ name: 'some-other-alarm' });
    expect(mockRuntimeSendMessage).not.toHaveBeenCalled();

    listener({ name: 'casper-keep-alive' });
    expect(mockRuntimeSendMessage).toHaveBeenCalledWith('keepAlive');
  });

  it('swallows the expected "Receiving end does not exist" ping rejection without logging', async () => {
    mockRuntimeSendMessage.mockRejectedValue(
      new Error('Could not establish connection. Receiving end does not exist.')
    );
    const listener = mockAlarmsOnAlarmAddListener.mock.calls[0][0];

    listener({ name: 'casper-keep-alive' });
    await flushPromises();

    expect(console.error).not.toHaveBeenCalled();
  });

  it('logs unexpected ping rejections', async () => {
    mockRuntimeSendMessage.mockRejectedValue(new Error('boom'));
    const listener = mockAlarmsOnAlarmAddListener.mock.calls[0][0];

    listener({ name: 'casper-keep-alive' });
    await flushPromises();

    expect(console.error).toHaveBeenCalledWith(
      'KeepAlive error:',
      expect.any(Error)
    );
  });
});

// This block resets the module registry, so it must come after the
// shared-instance describe above — the idempotency guard is module state, and
// each test needs a freshly evaluated module (mirroring an SW cold start).
describe('keep-alive idempotency guard', () => {
  const loadFreshKeepAlive = () => {
    jest.resetModules();
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { alarms: freshAlarms } = require('webextension-polyfill');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const keepAliveModule = require('@background/keep-alive');
    return { freshAlarms, keepAliveModule };
  };

  it('repeated startKeepAlive creates the alarm only once — store updates must not reset its schedule', () => {
    const { freshAlarms, keepAliveModule } = loadFreshKeepAlive();

    keepAliveModule.startKeepAlive();
    keepAliveModule.startKeepAlive();
    keepAliveModule.startKeepAlive();

    expect(freshAlarms.create).toHaveBeenCalledTimes(1);
  });

  it('repeated stopKeepAlive clears the alarm only once', () => {
    const { freshAlarms, keepAliveModule } = loadFreshKeepAlive();

    keepAliveModule.stopKeepAlive();
    keepAliveModule.stopKeepAlive();

    expect(freshAlarms.clear).toHaveBeenCalledTimes(1);
  });

  it('stopKeepAlive as the first call after SW start still clears a persisted stale alarm', () => {
    // Alarms survive SW restarts: if the SW cold-starts locked while the
    // previous life's alarm is still scheduled, the first stop must reach
    // the alarms API even though this module instance never started it.
    const { freshAlarms, keepAliveModule } = loadFreshKeepAlive();

    keepAliveModule.stopKeepAlive();

    expect(freshAlarms.clear).toHaveBeenCalledWith('casper-keep-alive');
  });

  it('start → stop → start transitions each reach the alarms API', () => {
    const { freshAlarms, keepAliveModule } = loadFreshKeepAlive();

    keepAliveModule.startKeepAlive();
    keepAliveModule.stopKeepAlive();
    keepAliveModule.startKeepAlive();

    expect(freshAlarms.create).toHaveBeenCalledTimes(2);
    expect(freshAlarms.clear).toHaveBeenCalledTimes(1);
  });
});

// This block resets the module registry, so it must stay the last describe in
// the file — earlier tests rely on the module instance imported at the top.
describe('keep-alive on non-Chrome builds', () => {
  afterEach(() => {
    // Drop the doMock overrides so they cannot leak into later requires
    jest.dontMock('webextension-polyfill');
    jest.dontMock('@src/utils');
  });

  it('module loads without throwing when the alarms API is unavailable (Firefox/Safari)', () => {
    // resetModules (not isolateModules) is required here: the top-level import
    // of @background/keep-alive already cached the module, and isolateModules
    // would hand back that cached instance instead of re-evaluating it.
    jest.resetModules();

    // Firefox/Safari manifests do not declare the `alarms` permission, so
    // webextension-polyfill exposes no `alarms` namespace there.
    jest.doMock('webextension-polyfill', () => ({
      alarms: undefined,
      runtime: { sendMessage: jest.fn().mockResolvedValue(undefined) }
    }));
    jest.doMock('@src/utils', () => ({ isChromeBuild: false }));

    expect(() =>
      // A CJS require (not import) is deliberate: it re-evaluates the module
      // synchronously through jest's reset registry with the doMocks above.
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      require('@background/keep-alive')
    ).not.toThrow();
  });
});
