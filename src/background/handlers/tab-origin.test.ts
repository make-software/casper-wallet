import { tabs } from 'webextension-polyfill';

import { getLiveTabOrigin } from './tab-origin';

jest.mock('webextension-polyfill', () => ({
  tabs: { get: jest.fn() }
}));

const getMock = tabs.get as jest.MockedFunction<typeof tabs.get>;

beforeEach(() => {
  getMock.mockReset();
});

it('returns the origin of the tab top-level document', async () => {
  getMock.mockResolvedValue({ url: 'https://dapp.example/app?x=1' } as never);

  await expect(getLiveTabOrigin(7)).resolves.toBe('https://dapp.example');
});

it('returns null when the tab is gone', async () => {
  getMock.mockRejectedValue(new Error('No tab with id: 7'));

  await expect(getLiveTabOrigin(7)).resolves.toBeNull();
});

it('returns null when the tab carries no url', async () => {
  getMock.mockResolvedValue({} as never);

  await expect(getLiveTabOrigin(7)).resolves.toBeNull();
});

it('returns null for an opaque origin', async () => {
  getMock.mockResolvedValue({ url: 'about:blank' } as never);

  await expect(getLiveTabOrigin(7)).resolves.toBeNull();
});

it('returns null for an unparseable url', async () => {
  getMock.mockResolvedValue({ url: 'not a url' } as never);

  await expect(getLiveTabOrigin(7)).resolves.toBeNull();
});

it('never logs the url', async () => {
  const consoleError = jest
    .spyOn(console, 'error')
    .mockImplementation(() => {});
  getMock.mockResolvedValue({
    url: 'https://dapp.example/?message=secret'
  } as never);

  await getLiveTabOrigin(7);

  expect(consoleError).not.toHaveBeenCalled();
  consoleError.mockRestore();
});
