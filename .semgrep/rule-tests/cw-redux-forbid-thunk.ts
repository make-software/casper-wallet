// @ts-nocheck — semgrep pattern fixture, not type-checked code.
// Test fixture for cw-redux-forbid-thunk.
// Import order is meaningful here: annotations must sit directly above their
// import. This directory is listed in .prettierignore so the import-sort
// plugin cannot reorder them.

// ruleid: cw-redux-forbid-thunk
import thunk from 'redux-thunk';

// ruleid: cw-redux-forbid-thunk
import { withExtraArgument } from 'redux-thunk';

// ruleid: cw-redux-forbid-thunk
import { createSlice, createAsyncThunk, configureStore } from '@reduxjs/toolkit';

// ok: cw-redux-forbid-thunk
import { createAction } from '@reduxjs/toolkit';

// ok: cw-redux-forbid-thunk
import { takeLatest } from 'redux-saga/effects';

// ruleid: cw-redux-forbid-thunk
export const fetchThing = createAsyncThunk('thing/fetch', async () => ({}));

export function* saga() {
  // ok: cw-redux-forbid-thunk
  yield takeLatest('thing/fetch', function* () {});
}

export { thunk, withExtraArgument, createSlice, configureStore, createAction };
