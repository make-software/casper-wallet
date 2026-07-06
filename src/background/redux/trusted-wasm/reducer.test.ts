import {
  addWasmToTrusted,
  removeAllWasmFromTrustedOrigin,
  removeWasmFromTrusted,
  resetTrustedWasmState
} from './actions';
import { reducer } from './reducer';

describe('trustedWasm reducer', () => {
  const initialState = { hashesByOriginDict: {} };

  it('has the expected initial state', () => {
    expect(reducer(undefined, { type: '@@INIT' } as any)).toEqual(initialState);
  });

  it('adds a wasm hash for an origin', () => {
    const state = reducer(
      initialState,
      addWasmToTrusted({ origin: 'https://app.example', wasmHash: 'hash1' })
    );
    expect(state).toEqual({
      hashesByOriginDict: { 'https://app.example': ['hash1'] }
    });
  });

  it('dedupes hashes added twice for the same origin', () => {
    const withOne = reducer(
      initialState,
      addWasmToTrusted({ origin: 'https://app.example', wasmHash: 'hash1' })
    );
    const withDupe = reducer(
      withOne,
      addWasmToTrusted({ origin: 'https://app.example', wasmHash: 'hash1' })
    );
    expect(withDupe).toEqual({
      hashesByOriginDict: { 'https://app.example': ['hash1'] }
    });
  });

  it('keeps per-origin hash lists separate', () => {
    const withA = reducer(
      initialState,
      addWasmToTrusted({ origin: 'https://a.example', wasmHash: 'hashA' })
    );
    const withB = reducer(
      withA,
      addWasmToTrusted({ origin: 'https://b.example', wasmHash: 'hashB' })
    );
    expect(withB).toEqual({
      hashesByOriginDict: {
        'https://a.example': ['hashA'],
        'https://b.example': ['hashB']
      }
    });
  });

  it('removes a wasm hash from an origin via isKeysEqual (case-insensitive)', () => {
    const seeded = {
      hashesByOriginDict: { 'https://app.example': ['0xDEADBEEF'] }
    };
    const state = reducer(
      seeded,
      removeWasmFromTrusted({
        origin: 'https://app.example',
        wasmHash: '0xdeadbeef'
      })
    );
    expect(state).toEqual({
      hashesByOriginDict: { 'https://app.example': [] }
    });
  });

  it('leaves state untouched when removing from an origin with no entry', () => {
    const seeded = { hashesByOriginDict: {} };
    const state = reducer(
      seeded,
      removeWasmFromTrusted({
        origin: 'https://app.example',
        wasmHash: 'hash1'
      })
    );
    expect(state).toEqual(seeded);
  });

  it('removeAllWasmFromTrustedOrigin removes the origin key and other origins survive', () => {
    const seeded = {
      hashesByOriginDict: {
        'https://a.example': ['hashA'],
        'https://b.example': ['hashB']
      }
    };
    const state = reducer(
      seeded,
      removeAllWasmFromTrustedOrigin({ origin: 'https://a.example' })
    );
    expect(state).toEqual({
      hashesByOriginDict: { 'https://b.example': ['hashB'] }
    });
    expect(
      Object.prototype.hasOwnProperty.call(
        state.hashesByOriginDict,
        'https://a.example'
      )
    ).toBe(false);
  });

  it('falls back to an empty dict when state has no hashesByOriginDict (addWasmToTrusted)', () => {
    const state = reducer(
      {} as any,
      addWasmToTrusted({ origin: 'https://app.example', wasmHash: 'hash1' })
    );
    expect(state).toEqual({
      hashesByOriginDict: { 'https://app.example': ['hash1'] }
    });
  });

  it('falls back to an empty dict when state has no hashesByOriginDict (removeWasmFromTrusted else-branch)', () => {
    const state = reducer(
      {} as any,
      removeWasmFromTrusted({ origin: 'https://app.example', wasmHash: 'h' })
    );
    // else-branch returns `{ ...state }`; the ?? fallback still fires for the guard read
    expect(state).toEqual({});
  });

  it('falls back to an empty dict when state has no hashesByOriginDict (removeAllWasmFromTrustedOrigin)', () => {
    const state = reducer(
      {} as any,
      removeAllWasmFromTrustedOrigin({ origin: 'https://app.example' })
    );
    expect(state).toEqual({ hashesByOriginDict: {} });
  });

  it('resets to initial state on resetTrustedWasmState', () => {
    const seeded = {
      hashesByOriginDict: { 'https://app.example': ['hash1'] }
    };
    expect(reducer(seeded, resetTrustedWasmState())).toEqual(initialState);
  });
});
