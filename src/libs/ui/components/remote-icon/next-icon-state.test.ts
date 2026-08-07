import { nextHasError } from './next-icon-state';

describe('nextHasError', () => {
  it('clears hasError on a srcChanged event, regardless of the prior value', () => {
    expect(nextHasError(true, { type: 'srcChanged' })).toBe(false);
    expect(nextHasError(false, { type: 'srcChanged' })).toBe(false);
  });

  it('sets hasError on a loadError event, regardless of the prior value', () => {
    expect(nextHasError(false, { type: 'loadError' })).toBe(true);
    expect(nextHasError(true, { type: 'loadError' })).toBe(true);
  });

  it('does not let an error latch onto a recycled row: loadError, then a genuine srcChanged clears it', () => {
    const afterError = nextHasError(false, { type: 'loadError' });
    expect(afterError).toBe(true);

    // The same component instance is recycled to show a different token —
    // the effect behind this event only ever fires when src genuinely
    // changed (React's own dependency-array guarantee), so a srcChanged
    // event here always means a new, unrelated icon.
    const afterRecycle = nextHasError(afterError, { type: 'srcChanged' });
    expect(afterRecycle).toBe(false);
  });
});
