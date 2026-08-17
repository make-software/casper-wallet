import { resolveOwnPermissionWindowId } from './ledger-window-ownership';

const none = {
  slotWindowId: null,
  openerWindowId: null,
  openedWindowId: null,
  hostWindowId: null
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

  it('a remounted instance in the opener window owns it (popup torn down and reopened)', () => {
    // Neither `openedWindowId` (a fresh ref) nor `hostWindowId` (the browser
    // window, not the permission window) matches — only the persisted opener.
    expect(
      resolveOwnPermissionWindowId({
        ...none,
        slotWindowId: 20,
        openerWindowId: 3,
        hostWindowId: 3
      })
    ).toBe(20);
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

  it('the opener witness is per window, not per instance: a sibling in the opener window owns the slot', () => {
    // The popup renders one document per browser window, so this is the
    // remount case again, not a leak to a foreign flow.
    expect(
      resolveOwnPermissionWindowId({
        ...none,
        slotWindowId: 99,
        openerWindowId: 3,
        openedWindowId: 20,
        hostWindowId: 3
      })
    ).toBe(99);
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
