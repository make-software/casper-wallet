import { shouldCloseOpenerAfterHandoff } from './ledger-opener-handoff';

describe('shouldCloseOpenerAfterHandoff', () => {
  it('closes a popup opener: the permission window finishes the flow alone', () => {
    expect(
      shouldCloseOpenerAfterHandoff({
        permissionWindowDomain: 'popup.html',
        isPermissionWindow: false
      })
    ).toBe(true);
  });

  it('keeps an approval-window opener: closing it cancels the dapp request', () => {
    expect(
      shouldCloseOpenerAfterHandoff({
        permissionWindowDomain: 'signature-request.html',
        isPermissionWindow: false
      })
    ).toBe(false);
  });

  it('keeps a permission window that opened one of its own', () => {
    expect(
      shouldCloseOpenerAfterHandoff({
        permissionWindowDomain: 'popup.html',
        isPermissionWindow: true
      })
    ).toBe(false);
  });

  it('keeps an unrecognised opener surface', () => {
    expect(
      shouldCloseOpenerAfterHandoff({
        permissionWindowDomain: 'connect-to-app.html',
        isPermissionWindow: false
      })
    ).toBe(false);
  });
});
