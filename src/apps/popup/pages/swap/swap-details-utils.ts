import { SWAP_PRICE_IMPACT_WARNING_THRESHOLD } from 'casper-wallet-core/src/domain/constants/config';

export function isHighPriceImpact(priceImpact: string | null): boolean {
  if (priceImpact == null) {
    return false;
  }

  const value = Number(priceImpact);

  return !Number.isNaN(value) && value > SWAP_PRICE_IMPACT_WARNING_THRESHOLD;
}

/** `0.003` -> `'0.3'`, for the `Fee ({{percent}}%)` label. */
export function formatProtocolFeePercent(fee: number): string {
  return String(Number((fee * 100).toFixed(10)));
}
