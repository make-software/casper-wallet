// @ts-nocheck — semgrep pattern fixture, not type-checked code.
// Test fixture for cw-selector-factory-unmemoized-array-method.

// ruleid: cw-selector-factory-unmemoized-array-method
export const makeSelectByType = (type: string) => (state: RootState) =>
  state.items.filter(i => i.type === type);

// ruleid: cw-selector-factory-unmemoized-array-method
export const makeSelectNames = () => (state: RootState) =>
  state.items.map(i => i.name);

// ok: cw-selector-factory-unmemoized-array-method
export const makeSelectById = (id: string) => (state: RootState) =>
  state.itemsById[id];

// ok: cw-selector-factory-unmemoized-array-method
export const makeSelectFind = (id: string) => (state: RootState) =>
  state.items.find(i => i.id === id);

// ok: cw-selector-factory-unmemoized-array-method
export const makeSelectCount = () => (state: RootState) => state.items.length;
