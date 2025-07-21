import { createAction } from 'typesafe-actions';

export const addWasmToTrusted = createAction('ADD_WASM_TO_TRUSTED')<{
  origin: string;
  wasmHash: string;
}>();

export const removeWasmFromTrusted = createAction('REMOVE_WASM_FROM_TRUSTED')<{
  origin: string;
  wasmHash: string;
}>();

export const removeAllWasmFromTrustedOrigin = createAction(
  'REMOVE_ALL_WASM_FROM_TRUSTED_ORIGIN'
)<{
  origin: string;
}>();

export const resetTrustedWasmState = createAction('RESET_TRUSTED_WASM_STATE')();
