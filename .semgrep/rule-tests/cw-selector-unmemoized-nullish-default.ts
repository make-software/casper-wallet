// @ts-nocheck — semgrep pattern fixture, not type-checked code.
// Test fixture for cw-selector-unmemoized-nullish-default.

const EMPTY_ARRAY = [];

// ruleid: cw-selector-unmemoized-nullish-default
export const selectItems = (state: RootState) => state.items ?? [];

// ruleid: cw-selector-unmemoized-nullish-default
export const selectMap = (state: RootState) => state.map ?? {};

// ok: cw-selector-unmemoized-nullish-default
export const selectItemsSafe = (state: RootState) => state.items ?? EMPTY_ARRAY;

// ok: cw-selector-unmemoized-nullish-default
export const selectCount = (state: RootState) => state.count ?? 0;

// ok: cw-selector-unmemoized-nullish-default
export const selectName = (state: RootState) => state.name ?? '';

// ok: cw-selector-unmemoized-nullish-default
export const selectRaw = (state: RootState) => state.items;
