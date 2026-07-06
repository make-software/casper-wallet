import { recipientPublicKeyAdded, recipientPublicKeyReseted } from './actions';
import { reducer } from './reducer';

describe('recent-recipient-public-keys reducer', () => {
  it('has [] initial state', () => {
    expect(reducer(undefined, { type: '@@INIT' } as any)).toEqual([]);
  });
  it('prepends new keys', () => {
    expect(reducer(['b'], recipientPublicKeyAdded('a'))).toEqual(['a', 'b']);
  });
  it('moves an existing key to the front without duplicating', () => {
    expect(reducer(['a', 'b'], recipientPublicKeyAdded('b'))).toEqual([
      'b',
      'a'
    ]);
  });
  it('resets to []', () => {
    expect(reducer(['a'], recipientPublicKeyReseted())).toEqual([]);
  });
});
