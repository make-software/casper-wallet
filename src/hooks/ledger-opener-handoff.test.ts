import { decideOpenerHandoff } from './ledger-opener-handoff';

describe('decideOpenerHandoff', () => {
  it('closes a popup opener: the permission window finishes the flow alone', () => {
    expect(
      decideOpenerHandoff({
        permissionWindowDomain: 'popup.html',
        isPermissionWindow: false,
        permissionWindowAttached: false
      })
    ).toBe('close-popup');
  });

  it('dismisses an approval-window opener once the window shares its request', () => {
    expect(
      decideOpenerHandoff({
        permissionWindowDomain: 'signature-request.html',
        isPermissionWindow: false,
        permissionWindowAttached: true
      })
    ).toBe('close-approval-window');
  });

  it('keeps an approval-window opener whose request has no second display', () => {
    expect(
      decideOpenerHandoff({
        permissionWindowDomain: 'signature-request.html',
        isPermissionWindow: false,
        permissionWindowAttached: false
      })
    ).toBe('keep');
  });

  it('keeps a permission window that opened one of its own', () => {
    expect(
      decideOpenerHandoff({
        permissionWindowDomain: 'popup.html',
        isPermissionWindow: true,
        permissionWindowAttached: true
      })
    ).toBe('keep');
  });

  it('keeps an unrecognised opener surface', () => {
    expect(
      decideOpenerHandoff({
        permissionWindowDomain: 'connect-to-app.html',
        isPermissionWindow: false,
        permissionWindowAttached: true
      })
    ).toBe('keep');
  });
});
