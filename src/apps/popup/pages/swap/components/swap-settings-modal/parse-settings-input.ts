import Big from 'big.js';
import { HIGH_SLIPPAGE_WARNING_THRESHOLD } from 'casper-wallet-core/src/domain/constants/config';

export const sanitizeDecimalInput = (value: string): string => {
  const digitsAndDotOnly = value.replace(/,/g, '.').replace(/[^\d.]/g, '');

  // keep only the first dot
  return digitsAndDotOnly.replace(/(\..*)\./g, '$1');
};

export const sanitizeIntegerInput = (value: string): string =>
  value.replace(/\D/g, '');

/** Percent, truncated to 2 decimals; anything unparseable is 0 and the reducer clamps it up. */
export const parseSlippageInput = (value: string): number => {
  try {
    const normalized = (value ?? '').toString().trim().replace(/,/g, '.');

    if (!/^\d*(\.\d*)?$/.test(normalized)) {
      return 0;
    }

    // Big's toFixed(dp, 0) rounds down; plain float maths turns 0.29 into 0.28.
    return new Big(new Big(normalized || 0).toFixed(2, 0)).toNumber();
  } catch {
    return 0;
  }
};

/** Whole minutes; an empty field is 0 and the reducer clamps it up. */
export const parseDeadlineInput = (value: string): number =>
  parseInt(sanitizeIntegerInput(value), 10) || 0;

export const isHighSlippage = (value: string): boolean =>
  parseSlippageInput(value) >= HIGH_SLIPPAGE_WARNING_THRESHOLD;
