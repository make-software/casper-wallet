// @ts-nocheck — semgrep pattern fixture, not type-checked code.
// Test fixture for cw-selector-unmemoized-array-method.
// `paths.include` (**/src/background/redux/**/selectors.ts) is not exercised —
// semgrep --test bypasses `paths:`. See .semgrep/README.md.

// ruleid: cw-selector-unmemoized-array-method
export const selectNames = (state: RootState) =>
  state.accounts.list.map(a => a.name);

// ruleid: cw-selector-unmemoized-array-method
export const selectActive = (state: RootState) =>
  state.accounts.filter(a => a.active);

// ruleid: cw-selector-unmemoized-array-method
export const selectSorted = (state: RootState) => state.accounts.sort();

// ruleid: cw-selector-unmemoized-array-method
export const selectTotal = (state: RootState) =>
  state.amounts.reduce((a, b) => a + b, 0);

// ok: cw-selector-unmemoized-array-method
export const selectAll = (state: RootState) => state.accounts;

// ok: cw-selector-unmemoized-array-method
export const selectOne = (state: RootState) =>
  state.accounts.find(a => a.id === 1);

// ok: cw-selector-unmemoized-array-method
export const selectCount = (state: RootState) => state.accounts.length;

// ok: cw-selector-unmemoized-array-method
export const selectMemoized = createSelector(selectAll, accounts =>
  accounts.map(a => a.name)
);
