import {
  contactRemoved,
  contactUpdated,
  contactsReseted,
  newContactAdded
} from './actions';
import { reducer } from './reducer';

const bob = {
  name: 'Bob',
  publicKey: '01bb',
  lastModified: '2026-01-02T00:00:00.000Z'
};
const ann = {
  name: 'Ann',
  publicKey: '01aa',
  lastModified: '2026-01-03T00:00:00.000Z'
};

describe('contacts reducer', () => {
  it('has empty initial state', () => {
    expect(reducer(undefined, { type: '@@INIT' } as any)).toEqual({
      contacts: [],
      lastModified: null
    });
  });
  it('adds contacts sorted by name and stamps lastModified from payload', () => {
    const s1 = reducer(
      { contacts: [bob], lastModified: bob.lastModified },
      newContactAdded(ann)
    );
    expect(s1.contacts.map(c => c.name)).toEqual(['Ann', 'Bob']);
    expect(s1.lastModified).toBe(ann.lastModified);
  });
  it('removes by name and stamps a fresh ISO timestamp', () => {
    const s = reducer(
      { contacts: [ann, bob], lastModified: null },
      contactRemoved('Ann')
    );
    expect(s.contacts).toEqual([bob]);
    expect(new Date(s.lastModified!).toISOString()).toBe(s.lastModified);
  });
  it('updates by oldName', () => {
    const s = reducer(
      { contacts: [ann, bob], lastModified: null },
      contactUpdated({
        oldName: 'Bob',
        name: 'Rob',
        publicKey: '01cc',
        lastModified: '2026-02-01T00:00:00.000Z'
      })
    );
    expect(s.contacts.map(c => c.name)).toEqual(['Ann', 'Rob']);
    expect(s.lastModified).toBe('2026-02-01T00:00:00.000Z');
  });
  it('resets', () => {
    expect(
      reducer({ contacts: [ann], lastModified: 'x' }, contactsReseted())
    ).toEqual({
      contacts: [],
      lastModified: null
    });
  });
});
