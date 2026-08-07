import { getPayload } from './payload-map';

describe('getPayload', () => {
  it('returns the stored payload for an own key', () => {
    expect(getPayload({ req: 'json' }, 'req')).toBe('json');
  });

  it('returns undefined for a key the map does not hold', () => {
    expect(getPayload({ req: 'json' }, 'other')).toBeUndefined();
  });

  it.each([
    '__proto__',
    'toString',
    'constructor',
    'valueOf',
    'hasOwnProperty'
  ])('returns undefined for the inherited Object.prototype member %p', name => {
    expect(getPayload({}, name)).toBeUndefined();
  });

  it('still returns an own property that shadows an inherited name', () => {
    expect(getPayload({ ...{}, ['toString']: 'json' }, 'toString')).toBe(
      'json'
    );
  });
});
