import { activeOriginFaviconChanged } from './actions';
import { reducer } from './reducer';

describe('active-origin-favicon reducer', () => {
  it('has null initial state', () => {
    expect(reducer(undefined, { type: '@@INIT' } as any)).toBeNull();
  });
  it('stores and clears the favicon url', () => {
    expect(reducer(null, activeOriginFaviconChanged('https://x/i.png'))).toBe(
      'https://x/i.png'
    );
    expect(
      reducer('https://x/i.png', activeOriginFaviconChanged(null))
    ).toBeNull();
  });
});
