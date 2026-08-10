import { keysReseted, keysUpdated } from './actions';
import { reducer } from './reducer';

const full = {
  passwordHash: 'ph',
  passwordSaltHash: 'psh',
  keyDerivationSaltHash: 'kdsh'
};

describe('keys reducer', () => {
  it('starts with null hashes', () => {
    const s = reducer(undefined, { type: '@@INIT' } as any);
    expect(s.passwordHash).toBeNull();
    expect(s.passwordSaltHash).toBeNull();
    expect(s.keyDerivationSaltHash).toBeNull();
  });
  it('merges a full update', () => {
    const s = reducer(undefined as any, keysUpdated(full));
    expect(s).toMatchObject(full);
  });
  it('merges a PARTIAL update without dropping other hashes', () => {
    const s0 = reducer(undefined as any, keysUpdated(full));
    const s1 = reducer(s0, keysUpdated({ keyDerivationSaltHash: 'kdsh2' }));
    expect(s1).toMatchObject({ ...full, keyDerivationSaltHash: 'kdsh2' });
  });
  it('resets', () => {
    const s = reducer(
      reducer(undefined as any, keysUpdated(full)),
      keysReseted()
    );
    expect(s.passwordHash).toBeNull();
  });

  it('keysDoesExist starts false', () => {
    const s = reducer(undefined, { type: '@@INIT' } as any);
    expect(s.keysDoesExist).toBe(false);
  });
  it('keysDoesExist is true once all three hashes are present', () => {
    const s = reducer(undefined as any, keysUpdated(full));
    expect(s.keysDoesExist).toBe(true);
  });
  it('keysDoesExist stays false while only a partial payload has arrived', () => {
    const s = reducer(
      undefined as any,
      keysUpdated({ keyDerivationSaltHash: 'kdsh' })
    );
    expect(s.keysDoesExist).toBe(false);
  });
  it('keysDoesExist recomputes from post-merge state on a partial update', () => {
    const s0 = reducer(undefined as any, keysUpdated(full));
    const s1 = reducer(s0, keysUpdated({ keyDerivationSaltHash: 'kdsh2' }));
    expect(s1.keysDoesExist).toBe(true);
  });
  it('keysDoesExist is false after reset', () => {
    const s = reducer(
      reducer(undefined as any, keysUpdated(full)),
      keysReseted()
    );
    expect(s.keysDoesExist).toBe(false);
  });
});
