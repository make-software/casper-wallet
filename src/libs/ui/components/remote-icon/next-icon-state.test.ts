import { nextIconState } from './next-icon-state';

describe('nextIconState', () => {
  it('clears hasError when src changes', () => {
    expect(nextIconState({ src: 'a', hasError: true }, { src: 'b' })).toEqual({
      src: 'b',
      hasError: false
    });
  });

  it('preserves hasError when src is unchanged', () => {
    expect(nextIconState({ src: 'a', hasError: true }, { src: 'a' })).toEqual({
      src: 'a',
      hasError: true
    });

    expect(nextIconState({ src: 'a', hasError: false }, { src: 'a' })).toEqual({
      src: 'a',
      hasError: false
    });
  });

  it('does not let an error latch onto a recycled row: error, then row reuse with a new src', () => {
    // A row shows token-a and its image fails to load.
    const afterError = { src: 'token-a', hasError: true };

    // The same component instance is recycled to show token-b.
    const recycled = nextIconState(afterError, { src: 'token-b' });

    expect(recycled).toEqual({ src: 'token-b', hasError: false });
  });

  it('treats null and undefined src as distinct values, not both "no src"', () => {
    expect(
      nextIconState({ src: undefined, hasError: true }, { src: null })
    ).toEqual({ src: null, hasError: false });

    expect(nextIconState({ src: null, hasError: true }, { src: null })).toEqual(
      { src: null, hasError: true }
    );
  });
});
