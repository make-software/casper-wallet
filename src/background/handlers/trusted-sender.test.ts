import { Runtime } from 'webextension-polyfill';

import {
  isTrustedUiSender,
  warnUntrustedSameExtensionSender
} from './trusted-sender';

// `webextension-polyfill` throws outside an extension. Stub the identity +
// origin surface the security gate reads.
jest.mock('webextension-polyfill', () => ({
  runtime: {
    id: 'ext-id',
    getURL: (path: string) => `chrome-extension://ext-id/${path}`
  }
}));

describe('isTrustedUiSender (background security gate)', () => {
  it('all three satisfied (id matches, url present + under extension origin) → true', () => {
    const sender = {
      id: 'ext-id',
      url: 'chrome-extension://ext-id/popup.html'
    } as Runtime.MessageSender;

    expect(isTrustedUiSender(sender)).toBe(true);
  });

  it('id mismatch → false (another extension impersonating)', () => {
    const sender = {
      id: 'other-ext',
      url: 'chrome-extension://ext-id/popup.html'
    } as Runtime.MessageSender;

    expect(isTrustedUiSender(sender)).toBe(false);
  });

  it('url null → false (content-script / no page url)', () => {
    const sender = { id: 'ext-id', url: undefined } as Runtime.MessageSender;

    expect(isTrustedUiSender(sender)).toBe(false);
  });

  it('url not under getURL("") → false (web page on a spoofed origin)', () => {
    const sender = {
      id: 'ext-id',
      url: 'https://evil.example/chrome-extension://ext-id/'
    } as Runtime.MessageSender;

    expect(isTrustedUiSender(sender)).toBe(false);
  });
});

describe('warnUntrustedSameExtensionSender', () => {
  let warnSpy: jest.SpyInstance;

  beforeEach(() => {
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  it('foreign extension id → silent (another extension probing is not our diagnostic)', () => {
    const sender = {
      id: 'other-ext',
      url: 'chrome-extension://other-ext/page.html'
    } as Runtime.MessageSender;

    warnUntrustedSameExtensionSender(sender, 'redux action LOCK_VAULT');

    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('same extension id → warns with the context and the ORIGIN, never the query string', () => {
    // A content script of this extension carries our id and the host page URL,
    // which is exactly why the full URL must not be logged.
    const sender = {
      id: 'ext-id',
      url: 'https://dapp.example/page?session=secret'
    } as Runtime.MessageSender;

    warnUntrustedSameExtensionSender(sender, 'redux action LOCK_VAULT');

    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy).toHaveBeenCalledWith(
      'Background: redux action LOCK_VAULT from same-extension sender rejected by URL check:',
      'https://dapp.example'
    );
  });

  it('unparseable url → warns with undefined instead of throwing out of the router', () => {
    const sender = { id: 'ext-id', url: 'not a url' } as Runtime.MessageSender;

    expect(() =>
      warnUntrustedSameExtensionSender(sender, 'redux action LOCK_VAULT')
    ).not.toThrow();
    expect(warnSpy).toHaveBeenCalledWith(
      'Background: redux action LOCK_VAULT from same-extension sender rejected by URL check:',
      undefined
    );
  });

  it('absent url → warns with undefined', () => {
    const sender = { id: 'ext-id', url: undefined } as Runtime.MessageSender;

    warnUntrustedSameExtensionSender(sender, 'redux action LOCK_VAULT');

    expect(warnSpy).toHaveBeenCalledWith(
      'Background: redux action LOCK_VAULT from same-extension sender rejected by URL check:',
      undefined
    );
  });
});
