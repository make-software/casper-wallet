import { windows } from 'webextension-polyfill';

import { collectRequestIdsFromOpenWindows } from './open-request-windows';

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

  // A silently skipped tab purges a live request with nothing pointing at the
  // cause, so the skip is logged — redacted, never the raw url.
  //
  // Asserted positively as well as negatively: `new URL`'s TypeError says only
  // `Invalid URL`, so absence assertions alone would still pass on a line that
  // names no tab at all and leaves the operator where they were.
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

  // `sdk.bundle.js` is web-accessible on all three targets, and the extension
  // id is public (`content/index.ts` puts it in the page DOM), so the origin
  // alone does not make a URL ours to trust.
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

  // The closed set. `popup.html` carries no `requestId` today, but it is
  // `use-ledger.ts`'s default `domain`, and a missed Ledger window purges a
  // payload mid-signature.
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

  // The argument's TYPE is asserted, not only its content. A plain `Error` has
  // no enumerable own properties, so `JSON.stringify` renders it `{}` and the
  // two absence assertions below hold whatever the code does — dropping
  // `redactUrlQuery` and logging the error object would keep them green while
  // the console started printing the untruncated message.
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
