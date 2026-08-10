import { vaultCipherCreated, vaultCipherReseted } from './actions';
import { reducer } from './reducer';

describe('vault-cipher reducer', () => {
  it('has null initial state', () => {
    expect(reducer(undefined, { type: '@@INIT' } as any)).toBeNull();
  });
  it('stores the cipher blob', () => {
    expect(
      reducer(null, vaultCipherCreated({ vaultCipher: 'AAECbase64' }))
    ).toBe('AAECbase64');
  });
  it('resets to null', () => {
    expect(reducer('AAECbase64', vaultCipherReseted())).toBeNull();
  });
});
