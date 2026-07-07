import {
  contactEditingPermissionChanged,
  encryptionKeyHashCreated,
  sessionReseted,
  vaultUnlocked
} from './actions';
import { reducer } from './reducer';

describe('session reducer', () => {
  it('starts locked with no encryption key and editing disallowed', () => {
    const s = reducer(undefined, { type: '@@INIT' } as any);
    expect(s.encryptionKeyHash).toBeNull();
    expect(s.isLocked).toBe(true);
    expect(s.isContactEditingAllowed).toBe(false);
  });
  it('unlocks on vaultUnlocked', () => {
    const s = reducer(undefined as any, vaultUnlocked());
    expect(s.isLocked).toBe(false);
  });
  it('stores the encryption key hash on encryptionKeyHashCreated', () => {
    const s = reducer(
      undefined as any,
      encryptionKeyHashCreated({ encryptionKeyHash: 'ekh' })
    );
    expect(s.encryptionKeyHash).toBe('ekh');
  });
  it('allows contact editing on contactEditingPermissionChanged', () => {
    const s = reducer(undefined as any, contactEditingPermissionChanged());
    expect(s.isContactEditingAllowed).toBe(true);
  });
  it('resets to the initial state on sessionReseted', () => {
    const unlocked = reducer(undefined as any, vaultUnlocked());
    const s = reducer(unlocked, sessionReseted());
    expect(s.isLocked).toBe(true);
    expect(s.encryptionKeyHash).toBeNull();
    expect(s.isContactEditingAllowed).toBe(false);
  });

  it('encryptionKeyDoesExist starts false', () => {
    const s = reducer(undefined, { type: '@@INIT' } as any);
    expect(s.encryptionKeyDoesExist).toBe(false);
  });
  it('encryptionKeyDoesExist is true after encryptionKeyHashCreated', () => {
    const s = reducer(
      undefined as any,
      encryptionKeyHashCreated({ encryptionKeyHash: 'ekh' })
    );
    expect(s.encryptionKeyDoesExist).toBe(true);
  });
  it('encryptionKeyDoesExist is false again after sessionReseted', () => {
    const created = reducer(
      undefined as any,
      encryptionKeyHashCreated({ encryptionKeyHash: 'ekh' })
    );
    const s = reducer(created, sessionReseted());
    expect(s.encryptionKeyDoesExist).toBe(false);
  });
});
