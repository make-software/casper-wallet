// @ts-nocheck — semgrep pattern fixture, not type-checked code.
// Test fixture for cw-selector-unmemoized-util-call.

// ruleid: cw-selector-unmemoized-util-call
export const selectOrdered = (state: RootState) =>
  orderBy(state.accounts, ['name']);

// ruleid: cw-selector-unmemoized-util-call
export const selectSorted = (state: RootState) =>
  sortBy(state.accounts, 'name');

// ruleid: cw-selector-unmemoized-util-call
export const selectGrouped = (state: RootState) =>
  groupBy(state.accounts, 'type');

// ruleid: cw-selector-unmemoized-util-call
export const selectValues = (state: RootState) =>
  Object.values(state.accountsById);

// ruleid: cw-selector-unmemoized-util-call
export const selectKeys = (state: RootState) => Object.keys(state.accountsById);

// ruleid: cw-selector-unmemoized-util-call
export const selectEntries = (state: RootState) =>
  Object.entries(state.accountsById);

// ruleid: cw-selector-unmemoized-util-call
export const selectFromSet = (state: RootState) => Array.from(state.idSet);

// ok: cw-selector-unmemoized-util-call
export const selectFrozen = (state: RootState) => Object.freeze(state.config);

// ok: cw-selector-unmemoized-util-call
export const selectById = (state: RootState) => state.accountsById;

// ok: cw-selector-unmemoized-util-call
export const selectHas = (state: RootState) =>
  Object.hasOwn(state.accountsById, 'a');
