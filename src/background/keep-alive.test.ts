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
});

afterAll(() => {
  (console.log as jest.Mock).mockRestore();
});

describe('keep-alive', () => {
  beforeEach(() => {
    mockAlarmsCreate.mockClear();
    mockAlarmsClear.mockClear();
    mockRuntimeSendMessage.mockClear();
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
