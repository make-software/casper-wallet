import Big from 'big.js';
import { HIGH_SLIPPAGE_WARNING_THRESHOLD } from 'casper-wallet-core/src/domain/constants/config';

export const sanitizeDecimalInput = (value: string): string => {
  const digitsAndDotOnly = value.replace(/,/g, '.').replace(/[^\d.]/g, '');

  // keep only the first dot
  return digitsAndDotOnly.replace(/(\..*)\./g, '$1');
};

export const sanitizeIntegerInput = (value: string): string =>
  value.replace(/\D/g, '');

/** Percent, truncated to 2 decimals. Anything unparseable — including an empty field — is 0;
 *  the settings reducer clamps 0 up to MIN_SLIPPAGE. */
export const parseSlippageInput = (value: string): number => {
  try {
    const normalized = (value ?? '').toString().trim().replace(/,/g, '.');

    // Allow: "", "123", "123.", ".5", "123.45"
    if (!/^\d*(\.\d*)?$/.test(normalized)) {
      return 0;
    }

    // Big's toFixed(dp, 0) rounds down; plain float maths turns 0.29 into 0.28.
    return new Big(new Big(normalized || 0).toFixed(2, 0)).toNumber();
  } catch {
    return 0;
  }
};

/** Whole minutes. An empty field is 0; the reducer clamps 0 up to MIN_DEADLINE. */
export const parseDeadlineInput = (value: string): number =>
  parseInt(sanitizeIntegerInput(value), 10) || 0;

export const isHighSlippage = (value: string): boolean =>
  parseSlippageInput(value) >= HIGH_SLIPPAGE_WARNING_THRESHOLD;
