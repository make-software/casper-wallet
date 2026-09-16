const VALID_AMOUNT_PATTERN = /^\d*\.?\d*$/;

/** The value to store, or `null` when the keystroke must be rejected. */
export function sanitizeAmountInput(
  raw: string,
  decimals: number
): string | null {
  const stripped = raw.replace(/,/g, '');
  const promoted = stripped.startsWith('.') ? `0${stripped}` : stripped;

  if (!VALID_AMOUNT_PATTERN.test(promoted)) {
    return null;
  }

  const [, fraction] = promoted.split('.');
  if (fraction != null && fraction.length > decimals) {
    return null;
  }

  return promoted;
}

/**
 * Thousand separators for the integer part, preserving an in-progress decimal tail.
 * `maxFractionDigits` truncates rather than rounds; leave it unset while the field has focus.
 */
export function formatAmountForDisplay(
  value: string,
  maxFractionDigits?: number
): string {
  if (value === '') {
    return '';
  }

  const [integerPart, fraction] = value.split('.');
  const groupedInteger =
    integerPart === ''
      ? '0'
      : new Intl.NumberFormat('en-US').format(Number(integerPart));

  if (fraction == null) {
    return groupedInteger;
  }

  const capped =
    maxFractionDigits == null ? fraction : fraction.slice(0, maxFractionDigits);

  return `${groupedInteger}.${capped}`;
}
