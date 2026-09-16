import { windows } from 'webextension-polyfill';

import { WindowApp, getUrlByWindowApp } from './create-open-window';
import {
  REQUEST_BEARING_PATHNAMES,
  collectRequestIdsFromOpenWindows
} from './open-request-windows';

jest.mock('webextension-polyfill', () => ({
  windows: { getAll: jest.fn().mockResolvedValue([]) },
  runtime: { getURL: jest.fn(() => 'chrome-extension://abcdefghijklmnop/') }
}));

const mockWindowsGetAll = windows.getAll as jest.Mock;

const approvalWindowUrl = (requestId: string) =>
  `chrome-extension://abcdefghijklmnop/signature-request.html` +
  `?requestId=${requestId}&origin=https%3A%2F%2Fdapp.example&tabId=7` +
  `#/sign-deploy`;

beforeEach(() => {
  mockWindowsGetAll.mockReset().mockResolvedValue([]);
  jest.spyOn(console, 'error').mockImplementation(() => undefined);
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('collectRequestIdsFromOpenWindows', () => {
  it('asks for populated windows — without tabs there is no URL to read', async () => {
    await collectRequestIdsFromOpenWindows();

    expect(mockWindowsGetAll).toHaveBeenCalledWith({ populate: true });
  });

  it('collects the requestId out of an approval window URL, hash and all', async () => {
    mockWindowsGetAll.mockResolvedValue([
      { id: 1, tabs: [{ url: approvalWindowUrl('req-1') }] }
    ]);

    expect(await collectRequestIdsFromOpenWindows()).toEqual(
      new Set(['req-1'])
    );
  });

  // The Ledger permission window carries the same requestId as the approval
  // window it was opened from (`src/hooks/use-ledger.ts`).
  it('unions ids across windows and across tabs, de-duplicating repeats', async () => {
    mockWindowsGetAll.mockResolvedValue([
      {
        id: 1,
        tabs: [
          { url: approvalWindowUrl('req-1') },
          { url: approvalWindowUrl('req-2') }
        ]
      },
      { id: 2, tabs: [{ url: approvalWindowUrl('req-1') }] }
    ]);

    expect(await collectRequestIdsFromOpenWindows()).toEqual(
      new Set(['req-1', 'req-2'])
    );
  });

  it('falls back to pendingUrl while a tab is still navigating', async () => {
    mockWindowsGetAll.mockResolvedValue([
      { id: 1, tabs: [{ pendingUrl: approvalWindowUrl('req-pending') }] }
    ]);

    expect(await collectRequestIdsFromOpenWindows()).toEqual(
      new Set(['req-pending'])
    );
  });

  it('ignores windows and tabs that carry no usable url', async () => {
    mockWindowsGetAll.mockResolvedValue([
      { id: 1 },
      { id: 2, tabs: [] },
      { id: 3, tabs: [{}, { url: '' }] },
      {
        id: 4,
        tabs: [{ url: 'chrome-extension://abcdefghijklmnop/popup.html' }]
      }
    ]);

    expect(await collectRequestIdsFromOpenWindows()).toEqual(new Set());
  });

  it('skips an unparseable url and keeps reading the rest', async () => {
    mockWindowsGetAll.mockResolvedValue([
      { id: 1, tabs: [{ url: 'not a url' }] },
      { id: 2, tabs: [{ url: approvalWindowUrl('req-1') }] }
    ]);

    expect(await collectRequestIdsFromOpenWindows()).toEqual(
      new Set(['req-1'])
    );
  });

  // Asserted positively as well as negatively: `Invalid URL` names no tab, so
  // absence assertions alone would pass on a log line that identifies nothing.
  it('logs the skipped url without its query string', async () => {
    const consoleError = jest.spyOn(console, 'error');
    mockWindowsGetAll.mockResolvedValue([
      { id: 1, tabs: [{ url: 'http://[::1/?message=my-secret-message' }] }
    ]);

    expect(await collectRequestIdsFromOpenWindows()).toEqual(new Set());

    expect(consoleError).toHaveBeenCalledTimes(1);
    expect(consoleError).toHaveBeenCalledWith(
      'collectRequestIdsFromOpenWindows: could not parse a tab url',
      'http://[::1/',
      expect.any(String)
    );
    const logged = JSON.stringify(consoleError.mock.calls);
    expect(logged).not.toContain('my-secret-message');
    expect(logged).not.toContain('?');
  });

  it('ignores an empty requestId param, which keeps no slot alive', async () => {
    mockWindowsGetAll.mockResolvedValue([
      {
        id: 1,
        tabs: [
          {
            url: 'chrome-extension://abcdefghijklmnop/signature-request.html?requestId='
          }
        ]
      }
    ]);

    expect(await collectRequestIdsFromOpenWindows()).toEqual(new Set());
  });

  // `requestId` is dapp-chosen, so without an origin check any page could put a
  // `?requestId=` of its choosing in its own URL and pin that slot forever.
  it('ignores a requestId carried by a page that is not one of ours', async () => {
    mockWindowsGetAll.mockResolvedValue([
      {
        id: 1,
        tabs: [{ url: 'https://evil.example/?requestId=req-1' }]
      }
    ]);

    expect(await collectRequestIdsFromOpenWindows()).toEqual(new Set());
  });

  it('reads our own pages while ignoring a foreign tab that spoofs the same id', async () => {
    mockWindowsGetAll.mockResolvedValue([
      { id: 1, tabs: [{ url: 'https://evil.example/?requestId=spoofed' }] },
      { id: 2, tabs: [{ url: approvalWindowUrl('req-1') }] }
    ]);

    expect(await collectRequestIdsFromOpenWindows()).toEqual(
      new Set(['req-1'])
    );
  });

  // `sdk.bundle.js` is web-accessible and the extension id is public, so the
  // origin alone does not make a URL ours to trust.
  it('ignores a requestId on a web-accessible resource of our own extension', async () => {
    mockWindowsGetAll.mockResolvedValue([
      {
        id: 1,
        tabs: [
          {
            url: 'chrome-extension://abcdefghijklmnop/sdk.bundle.js?requestId=req-1'
          }
        ]
      }
    ]);

    expect(await collectRequestIdsFromOpenWindows()).toEqual(new Set());
  });

  // `popup.html` carries no `requestId` today, but it is `use-ledger.ts`'s
  // default `domain`, and a missed Ledger window purges a payload mid-signature.
  it.each(['signature-request.html', 'connect-to-app.html', 'popup.html'])(
    'reads a requestId carried by %s',
    async page => {
      mockWindowsGetAll.mockResolvedValue([
        {
          id: 1,
          tabs: [
            {
              url: `chrome-extension://abcdefghijklmnop/${page}?requestId=req-1&tabId=7`
            }
          ]
        }
      ]);

      expect(await collectRequestIdsFromOpenWindows()).toEqual(
        new Set(['req-1'])
      );
    }
  );

  // Neither is ever opened with a `requestId`, and neither reads one.
  it.each(['onboarding.html', 'import-account-with-file.html'])(
    'ignores a requestId carried by %s, which never legitimately has one',
    async page => {
      mockWindowsGetAll.mockResolvedValue([
        {
          id: 1,
          tabs: [
            {
              url: `chrome-extension://abcdefghijklmnop/${page}?requestId=req-1`
            }
          ]
        }
      ]);

      expect(await collectRequestIdsFromOpenWindows()).toEqual(new Set());
    }
  );

  // `runtime.getURL('')` carries this extension's id, so the origin test is
  // per-extension, not merely per-protocol.
  it('ignores an extension page belonging to a different extension', async () => {
    mockWindowsGetAll.mockResolvedValue([
      {
        id: 1,
        tabs: [
          {
            url: 'chrome-extension://zzzzzzzzzzzzzzzz/signature-request.html?requestId=req-1'
          }
        ]
      }
    ]);

    expect(await collectRequestIdsFromOpenWindows()).toEqual(new Set());
  });

  // `null` is "no evidence", not "no window holds a request": the caller must
  // not purge on it.
  it('returns null rather than an empty set when the enumeration rejects', async () => {
    mockWindowsGetAll.mockRejectedValue(new Error('boom'));

    expect(await collectRequestIdsFromOpenWindows()).toBeNull();
  });

  // The argument's TYPE is asserted too: `JSON.stringify` renders a plain
  // `Error` as `{}`, so the absence assertions alone hold whatever the code does.
  it('never puts a window URL into the log when the enumeration rejects', async () => {
    const consoleError = jest.spyOn(console, 'error');
    mockWindowsGetAll.mockRejectedValue(
      new Error(
        'failed for chrome-extension://abcdefghijklmnop/signature-request.html?message=my-secret-message'
      )
    );

    await collectRequestIdsFromOpenWindows();

    expect(consoleError).toHaveBeenCalledWith(
      'collectRequestIdsFromOpenWindows: could not enumerate windows',
      expect.any(String)
    );
    const logged = JSON.stringify(consoleError.mock.calls);
    expect(logged).not.toContain('my-secret-message');
    expect(logged).not.toContain('?');
  });
});

// Nothing else ties `REQUEST_BEARING_PATHNAMES` to the URLs approval windows
// open at, so the pathnames are derived here rather than restated as literals.
describe('REQUEST_BEARING_PATHNAMES tracks every approval WindowApp', () => {
  const APPROVAL_WINDOW_APPS = [
    WindowApp.ConnectToApp,
    WindowApp.SwitchAccount,
    WindowApp.SignatureRequestDeploy,
    WindowApp.SignatureRequestMessage,
    WindowApp.SignatureRequestEip712,
    WindowApp.DecryptMessageRequest
  ];

  const pathnameFor = (windowApp: WindowApp) =>
    new URL(
      getUrlByWindowApp(windowApp),
      'chrome-extension://abcdefghijklmnop/'
    ).pathname;

  it.each(APPROVAL_WINDOW_APPS)(
    'covers the pathname %s opens at',
    windowApp => {
      expect(REQUEST_BEARING_PATHNAMES.has(pathnameFor(windowApp))).toBe(true);
    }
  );

  // Deliberately excluded: `import-account-with-file.html` is a separate
  // window, never displays a `?requestId=`.
  it('does not cover ImportAccount', () => {
    expect(
      REQUEST_BEARING_PATHNAMES.has(pathnameFor(WindowApp.ImportAccount))
    ).toBe(false);
  });
});
