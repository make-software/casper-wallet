import { resolveOwnPermissionWindowId } from './ledger-window-ownership';

const none = {
  slotWindowId: null,
  openerWindowId: null,
  openerRequestId: null,
  openedWindowId: null,
  hostWindowId: null,
  ownRequestId: null
};

describe('resolveOwnPermissionWindowId', () => {
  it('no slot → nothing to own, whatever the witnesses say', () => {
    expect(
      resolveOwnPermissionWindowId({
        ...none,
        openedWindowId: 20,
        hostWindowId: 20,
        openerWindowId: 20
      })
    ).toBeNull();
  });

  it('the instance that opened the slot window owns it', () => {
    expect(
      resolveOwnPermissionWindowId({
        ...none,
        slotWindowId: 20,
        openedWindowId: 20,
        hostWindowId: 3
      })
    ).toBe(20);
  });

  it('the instance rendering inside the slot window owns it', () => {
    expect(
      resolveOwnPermissionWindowId({
        ...none,
        slotWindowId: 20,
        hostWindowId: 20
      })
    ).toBe(20);
  });

  it('a remounted internal flow in the opener window owns it (popup torn down and reopened)', () => {
    // Neither `openedWindowId` (a fresh ref) nor `hostWindowId` (the browser
    // window, not the permission window) matches — only the persisted opener.
    // Both request ids are null: the internal flows have no dapp request.
    expect(
      resolveOwnPermissionWindowId({
        ...none,
        slotWindowId: 20,
        openerWindowId: 3,
        hostWindowId: 3
      })
    ).toBe(20);
  });

  it('a remounted dapp flow in the opener window owns it when the request matches', () => {
    expect(
      resolveOwnPermissionWindowId({
        ...none,
        slotWindowId: 20,
        openerWindowId: 100,
        openerRequestId: 'r1',
        hostWindowId: 100,
        ownRequestId: 'r1'
      })
    ).toBe(20);
  });

  it('a second dapp request reusing the approval window does NOT inherit the first one’s claim', () => {
    // The approval window is one tracked slot the next request reuses in place,
    // so window 100 hosts r2's fresh document while the slice still names r1's
    // permission window. Owning it here closes window 100 on the back arrow and
    // cancels r2 — the collateral cancel WALLET-1416 is about.
    expect(
      resolveOwnPermissionWindowId({
        ...none,
        slotWindowId: 20,
        openerWindowId: 100,
        openerRequestId: 'r1',
        hostWindowId: 100,
        ownRequestId: 'r2'
      })
    ).toBeNull();
  });

  it('an internal flow does not inherit a dapp flow’s claim on the same window', () => {
    expect(
      resolveOwnPermissionWindowId({
        ...none,
        slotWindowId: 20,
        openerWindowId: 100,
        openerRequestId: 'r1',
        hostWindowId: 100
      })
    ).toBeNull();
  });

  it('a foreign flow holding the slot reads as no window of mine', () => {
    expect(
      resolveOwnPermissionWindowId({
        ...none,
        slotWindowId: 99,
        openerWindowId: 5,
        openedWindowId: 20,
        hostWindowId: 3
      })
    ).toBeNull();
  });

  it('with no opener recorded, a stranger in the same browser window is not an owner', () => {
    expect(
      resolveOwnPermissionWindowId({
        ...none,
        slotWindowId: 20,
        hostWindowId: 3
      })
    ).toBeNull();
  });

  it('two unknowns are not a match: no opener recorded and no host window yet → null', () => {
    // The state the mount race produces — the slice's opener is whatever
    // `windows.getCurrent()` had resolved to at open time (null if it had not),
    // and the reading side is null until its own call lands. Without the
    // `openerWindowId != null` guard both sides compare equal and this instance,
    // which witnessed nothing, would own a foreign flow's window.
    expect(
      resolveOwnPermissionWindowId({ ...none, slotWindowId: 20 })
    ).toBeNull();
  });

  it('host window unknown (getCurrent unresolved) with no opener match → null, not a throw', () => {
    expect(
      resolveOwnPermissionWindowId({
        ...none,
        slotWindowId: 20,
        openerWindowId: 3
      })
    ).toBeNull();
  });
});
