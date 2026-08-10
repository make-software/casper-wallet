// @ts-nocheck — semgrep pattern fixture, not type-checked code.
// Test fixture for cw-store-singleton-outside-background.
// NOTE: semgrep --test bypasses `paths:`, so the rule runs here even though this
// file is not under src/. The `paths.exclude: src/background/**` block is NOT
// covered by these tests — see .semgrep/README.md → Testing custom rules.

// ruleid: cw-store-singleton-outside-background
import { getExistingMainStoreSingletonOrInit } from '@background/redux/get-main-store';

// ruleid: cw-store-singleton-outside-background
import { something, getExistingMainStoreSingletonOrInit, other } from '@background/redux/utils';

// ok: cw-store-singleton-outside-background
import { dispatchToMainStore } from '@background/redux/utils';

// ok: cw-store-singleton-outside-background
import { useSelector } from 'react-redux';

export function readState() {
  // ruleid: cw-store-singleton-outside-background
  const store = getExistingMainStoreSingletonOrInit();
  return store;
}

export function nested(flag) {
  if (flag) {
    // ruleid: cw-store-singleton-outside-background
    return getExistingMainStoreSingletonOrInit().getState();
  }
  // ok: cw-store-singleton-outside-background
  return dispatchToMainStore({ type: 'noop' });
}

// ok: cw-store-singleton-outside-background
export const unrelated = () => useSelector(s => s);
