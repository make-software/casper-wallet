import { createMainStoreReplica } from '@background/redux/create-main-store-replica';
import { PopupState, selectPopupState } from '@background/redux/popup-state';
import rootReducer from '@background/redux/root-reducer';
import { RootState } from '@background/redux/store-types';

const fullState = rootReducer(undefined, { type: '@@INIT' }) as RootState;

const CONTACT = {
  name: 'Alice',
  publicKey: 'pk',
  lastModified: '2026-01-01T00:00:00.000Z'
};

describe('createMainStoreReplica', () => {
  it('ignores slices outside POPUP_SLICES even when the payload carries them', () => {
    // Exactly what the old `...state` spread would have copied into a page with
    // no diagnostic at all: a full RootState satisfied the old generic's bound.
    const overWide = {
      ...selectPopupState(fullState),
      vaultCipher: 'SECRET-CIPHER'
    } as unknown as PopupState;

    const replica = createMainStoreReplica(overWide);

    expect(replica.getState().vaultCipher).not.toBe('SECRET-CIPHER');
    expect(JSON.stringify(replica.getState())).not.toContain('SECRET-CIPHER');
  });

  it('copies the listed slices through to the replica', () => {
    // The two assertions-by-absence below both hold if the allowlist copy stops
    // producing anything at all — every field they read comes from the explicit
    // `preloadedState` overrides. This one fails in that case.
    const seeded: RootState = {
      ...fullState,
      contacts: { ...fullState.contacts, contacts: [CONTACT] }
    };

    const replica = createMainStoreReplica(selectPopupState(seeded));

    expect(replica.getState().contacts.contacts).toEqual([CONTACT]);
  });

  it('restores the fields the reducers expect but the broadcast omits', () => {
    const replica = createMainStoreReplica(selectPopupState(fullState));
    const state = replica.getState();

    expect(state.windowManagement.requests).toEqual({});
    expect(state.windowManagement.exportKeysWindowId).toBeNull();
    expect(state.vault.payloadSeqById).toEqual({});
  });
});
