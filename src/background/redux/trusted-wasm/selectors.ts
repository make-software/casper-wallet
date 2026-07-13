import { RootState } from '@background/redux/store-types';

export const selectTrustedWasmByOrigin =
  (origin: string | null | undefined) =>
  (state: RootState): string[] => {
    const dict = state.trustedWasm.hashesByOriginDict;
    return origin != null && (dict?.[origin] || []).length > 0
      ? dict[origin]
      : [];
  };
