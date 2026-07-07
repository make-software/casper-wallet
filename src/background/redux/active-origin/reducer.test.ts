import { activeOriginChanged } from './actions';
import { reducer } from './reducer';

describe('active-origin reducer', () => {
  it('has null initial state', () => {
    expect(reducer(undefined, { type: '@@INIT' } as any)).toBeNull();
  });

  it('stores the new origin on activeOriginChanged', () => {
    expect(reducer(null, activeOriginChanged('https://app.example'))).toBe(
      'https://app.example'
    );
  });

  it('clears the origin on activeOriginChanged(null)', () => {
    expect(
      reducer('https://app.example', activeOriginChanged(null))
    ).toBeNull();
  });

  it('ignores unknown actions', () => {
    expect(reducer('https://app.example', { type: 'NOPE' } as any)).toBe(
      'https://app.example'
    );
  });
});
