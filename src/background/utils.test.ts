import { Tabs, tabs } from 'webextension-polyfill';

import { SdkEvent, sdkEvent } from '@content/sdk-event';

import {
  emitSdkEventToActiveTabs,
  emitSdkEventToActiveTabsWithOrigin
} from './utils';

jest.mock('webextension-polyfill', () => ({
  tabs: {
    query: jest.fn(),
    sendMessage: jest.fn()
  }
}));

const queryMock = tabs.query as jest.MockedFunction<typeof tabs.query>;
const sendMessageMock = tabs.sendMessage as jest.MockedFunction<
  typeof tabs.sendMessage
>;

function makeTab(overrides: Partial<Tabs.Tab>): Tabs.Tab {
  return {
    index: 0,
    highlighted: false,
    active: true,
    pinned: false,
    incognito: false,
    ...overrides
  } as Tabs.Tab;
}

const testAction: SdkEvent = sdkEvent.lockedEvent({
  isLocked: true,
  isConnected: undefined,
  activeKey: undefined,
  activeKeySupports: undefined
});

describe('emitSdkEventToActiveTabs', () => {
  let warnSpy: jest.SpyInstance;
  let errorSpy: jest.SpyInstance;

  beforeEach(() => {
    queryMock.mockReset();
    sendMessageMock.mockReset();
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
    errorSpy.mockRestore();
  });

  it('sends to every active http tab whose callback returns an action', async () => {
    const tab1 = makeTab({ id: 1, url: 'https://foo.com' });
    const tab2 = makeTab({ id: 2, url: 'https://bar.com' });
    queryMock.mockResolvedValue([tab1, tab2]);
    sendMessageMock.mockResolvedValue(undefined);

    await emitSdkEventToActiveTabs(() => testAction);

    expect(sendMessageMock).toHaveBeenCalledTimes(2);
    expect(sendMessageMock).toHaveBeenCalledWith(1, testAction);
    expect(sendMessageMock).toHaveBeenCalledWith(2, testAction);
  });

  it('skips non-http tabs and tabs where callback returns null/undefined', async () => {
    const httpTab = makeTab({ id: 1, url: 'https://foo.com' });
    const nonHttpTab = makeTab({ id: 2, url: 'chrome-extension://abc' });
    const noActionTab = makeTab({ id: 3, url: 'https://baz.com' });
    queryMock.mockResolvedValue([httpTab, nonHttpTab, noActionTab]);
    sendMessageMock.mockResolvedValue(undefined);

    await emitSdkEventToActiveTabs(tab => {
      if (tab.id === 3) return undefined;
      return testAction;
    });

    expect(sendMessageMock).toHaveBeenCalledTimes(1);
    expect(sendMessageMock).toHaveBeenCalledWith(1, testAction);
  });

  it('isolates a failing tab: second tab still receives its send and the function resolves', async () => {
    const failingTab = makeTab({ id: 1, url: 'https://foo.com' });
    const okTab = makeTab({ id: 2, url: 'https://bar.com' });
    queryMock.mockResolvedValue([failingTab, okTab]);
    sendMessageMock.mockImplementation(async tabId => {
      if (tabId === 1) {
        throw new Error('Receiving end does not exist');
      }
      return undefined;
    });

    await expect(
      emitSdkEventToActiveTabs(() => testAction)
    ).resolves.toBeUndefined();

    expect(sendMessageMock).toHaveBeenCalledWith(1, testAction);
    expect(sendMessageMock).toHaveBeenCalledWith(2, testAction);
    expect(warnSpy).toHaveBeenCalled();
  });

  it('skips a tab without an id instead of throwing', async () => {
    const noIdTab = makeTab({ url: 'https://foo.com' });
    const okTab = makeTab({ id: 2, url: 'https://bar.com' });
    queryMock.mockResolvedValue([noIdTab, okTab]);
    sendMessageMock.mockResolvedValue(undefined);

    await expect(
      emitSdkEventToActiveTabs(() => testAction)
    ).resolves.toBeUndefined();

    expect(sendMessageMock).toHaveBeenCalledTimes(1);
    expect(sendMessageMock).toHaveBeenCalledWith(2, testAction);
    expect(errorSpy).toHaveBeenCalled();
  });
});

describe('emitSdkEventToActiveTabsWithOrigin', () => {
  let warnSpy: jest.SpyInstance;
  let errorSpy: jest.SpyInstance;

  beforeEach(() => {
    queryMock.mockReset();
    sendMessageMock.mockReset();
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
    errorSpy.mockRestore();
  });

  it('sends only to tabs whose origin matches', async () => {
    const matchingTab = makeTab({ id: 1, url: 'https://foo.com/page' });
    const otherOriginTab = makeTab({ id: 2, url: 'https://bar.com/page' });
    queryMock.mockResolvedValue([matchingTab, otherOriginTab]);
    sendMessageMock.mockResolvedValue(undefined);

    const delivered = await emitSdkEventToActiveTabsWithOrigin(
      'https://foo.com',
      testAction
    );

    expect(sendMessageMock).toHaveBeenCalledTimes(1);
    expect(sendMessageMock).toHaveBeenCalledWith(1, testAction);
    // Delivered to exactly the one matching tab.
    expect(delivered).toBe(1);
  });

  it('does not query or send when origin is empty', async () => {
    const delivered = await emitSdkEventToActiveTabsWithOrigin('', testAction);

    expect(queryMock).not.toHaveBeenCalled();
    expect(sendMessageMock).not.toHaveBeenCalled();
    expect(delivered).toBe(0);
  });

  it('isolates a failing tab: second matching tab still receives its send and the function resolves', async () => {
    const failingTab = makeTab({ id: 1, url: 'https://foo.com/a' });
    const okTab = makeTab({ id: 2, url: 'https://foo.com/b' });
    queryMock.mockResolvedValue([failingTab, okTab]);
    sendMessageMock.mockImplementation(async tabId => {
      if (tabId === 1) {
        throw new Error('Receiving end does not exist');
      }
      return undefined;
    });

    // Only the second tab's send succeeded → count is 1, not 2.
    await expect(
      emitSdkEventToActiveTabsWithOrigin('https://foo.com', testAction)
    ).resolves.toBe(1);

    expect(sendMessageMock).toHaveBeenCalledWith(1, testAction);
    expect(sendMessageMock).toHaveBeenCalledWith(2, testAction);
    expect(warnSpy).toHaveBeenCalled();
  });

  it('skips a tab without an id instead of throwing', async () => {
    const noIdTab = makeTab({ url: 'https://foo.com/a' });
    const okTab = makeTab({ id: 2, url: 'https://foo.com/b' });
    queryMock.mockResolvedValue([noIdTab, okTab]);
    sendMessageMock.mockResolvedValue(undefined);

    await expect(
      emitSdkEventToActiveTabsWithOrigin('https://foo.com', testAction)
    ).resolves.toBe(1);

    expect(sendMessageMock).toHaveBeenCalledTimes(1);
    expect(sendMessageMock).toHaveBeenCalledWith(2, testAction);
    expect(errorSpy).toHaveBeenCalled();
  });
});
