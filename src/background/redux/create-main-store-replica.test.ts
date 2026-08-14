import { createMainStoreReplica } from '@background/redux/create-main-store-replica';
import { PopupState, selectPopupState } from '@background/redux/popup-state';
import rootReducer from '@background/redux/root-reducer';
import { RootState } from '@background/redux/store-types';

const fullState = rootReducer(undefined, { type: '@@INIT' }) as RootState;

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

  it('restores the fields the reducers expect but the broadcast omits', () => {
    const replica = createMainStoreReplica(selectPopupState(fullState));
    const state = replica.getState();

    expect(state.windowManagement.requests).toEqual({});
    expect(state.windowManagement.exportKeysWindowId).toBeNull();
    expect(state.vault.payloadSeqById).toEqual({});
  });
});
