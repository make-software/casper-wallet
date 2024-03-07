import { createIntl, createIntlCache } from '@formatjs/intl';
import Big from 'big.js';
// eslint-disable-next-line import/no-duplicates
import { formatDistanceToNowStrict } from 'date-fns';
// eslint-disable-next-line import/no-duplicates
import en from 'date-fns/locale/en-US';
import { ChangeEvent } from 'react';

import { MOTES_PER_CSPR_RATE } from '@src/constants';

const cache = createIntlCache();
const intl = createIntl(
  {
    // TODO: should implement using active lang from i18n
    locale: 'en-US',
    messages: {}
  },
  cache
);

const formatDistanceTokens = {
  lessThanXSeconds: 'second',
  xSeconds: 'second',
  lessThanXMinutes: 'minute',
  xMinutes: 'minute',
  xHours: 'hour',
  xDays: 'day',
  xMonths: 'month',
  xYears: 'year'
};

export const formatTimestamp = (value: string): string => {
  const date = new Date(value);
  const locale = 'en';
  const nativeIntl = new Intl.DateTimeFormat(locale, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    timeZoneName: 'short'
  });

  return `${nativeIntl.format(date)}`;
};

export const formatShortTimestamp = (value: string): string => {
  const date = new Date(value);
  const locale = 'en';
  const nativeIntl = new Intl.DateTimeFormat(locale, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: 'numeric'
  });

  return `${nativeIntl.format(date)}`;
};

export const formatDate = (value: string): string => {
  const timestamp = Number.parseInt(value);

  if (Number.isNaN(timestamp) || !Number.isInteger(timestamp)) {
    throw new Error("Couldn't get timestamp from string");
  }

  const date = new Date(timestamp);

  return `${intl.formatDate(date, {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })}, ${intl.formatTime(date, {
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric'
  })}`;
};

const formatDistance = (
  token: keyof typeof formatDistanceTokens,
  count: number,
  options: any
) => {
  options = options || {};
  const locale = options.locale.code || 'en';

  return new (Intl as any).RelativeTimeFormat(locale, {
    style: 'short'
  })
    .format(-count, formatDistanceTokens[token])
    .replace('.', '');
};

export const formatTimestampAge = (value: string): string => {
  const date = new Date(value);

  return `${formatDistanceToNowStrict(date, {
    addSuffix: true,
    locale: {
      ...en,
      formatDistance
    },
    roundingMethod: 'floor'
  })}`;
};

export const formatNumber = (
  value: number | string,
  {
    precision,
    notation,
    compactDisplay
  }: {
    precision?: { min?: number; max?: number };
    notation?: 'compact' | 'standard';
    compactDisplay?: 'short' | 'long';
  } = {}
): string =>
  intl.formatNumber(value as number, {
    minimumFractionDigits: precision?.min || 0,
    maximumFractionDigits: precision?.max || precision?.min || 0,
    notation,
    compactDisplay
  });

export function formatMotes(motes: string) {
  const int = Number.parseInt(motes);

  if (Number.isNaN(int)) {
    throw new Error('Parsing motes failed');
  }

  return int.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

export const motesToCSPR = (motes: string): string => {
  return Big(motes).div(MOTES_PER_CSPR_RATE).toFixed();
};

export const CSPRtoMotes = (cspr: string): string => {
  return Big(cspr).mul(MOTES_PER_CSPR_RATE).toFixed();
};

export const tokenDivider = (decimals: number | null) =>
  Big(10).pow(decimals || 0);

export const divideErc20Balance = (
  balance: string | null,
  decimals: number | null
): string | null => {
  if (balance == null) {
    return null;
  }
  return Big(balance).div(tokenDivider(decimals)).toFixed();
};

export const multiplyErc20Balance = (
  balance: string | null,
  decimals: number | null
): string | null => {
  if (balance == null) {
    return null;
  }
  return Big(balance).mul(tokenDivider(decimals)).toFixed();
};

export const motesToCurrency = (
  motes: string,
  currencyPerCsprRate: number
): string => {
  if (currencyPerCsprRate === 0) {
    throw new Error('motesToCurrency: the CSPR rate cannot be zero');
  }

  return Big(motes).div(MOTES_PER_CSPR_RATE).mul(currencyPerCsprRate).toFixed();
};

export function snakeAndKebabToCamel(str: string): string {
  return str
    .toLowerCase()
    .replace(/([-_][a-z0-9])/g, group =>
      group.toUpperCase().replace('-', '').replace('_', '')
    );
}

export function capitalizeString(str: string): string {
  return `${str[0].toUpperCase()}${str.slice(1)}`;
}

export const formatCurrency = (
  value: number | string,
  code: string,
  {
    precision
  }: {
    precision?: number;
  } = {}
): string => {
  return intl.formatNumber(value as number, {
    style: 'currency',
    currency: code,
    minimumFractionDigits: precision,
    maximumFractionDigits: precision
  });
};

export const formatFiatAmount = (
  amount: string,
  currencyRate: number | null,
  precision: number = 2
) => {
  if (!amount || currencyRate == null) {
    return null;
  }

  return formatCurrency(
    motesToCurrency(CSPRtoMotes(amount), currencyRate),
    'USD',
    {
      precision: precision
    }
  );
};

/**
 * This function formats the input value of an HTMLInputElement in an onChange event handler for input type="text".
 * It removes all non-digit characters and allows just one decimal point.
 * The result is set to the value of the event target.
 *
 * @param {ChangeEvent<HTMLInputElement>} event - The onChange event from an HTMLInputElement.
 */
export const formatInputAmountValue = (
  event: ChangeEvent<HTMLInputElement>
) => {
  // Get the original input value from the event target
  const original = event.target.value;

  // Prepare a clean string to hold the formatted value
  let clean = '';

  // Track whether a decimal point has been encountered
  let seenDot = false;

  // Loop through each character of the original value
  for (let i = 0; i < original.length; i++) {
    // If the character is a digit, it's added to the clean string
    if (original[i] >= '0' && original[i] <= '9') {
      clean += original[i];
    }
    // If the character is a dot and we haven't seen a dot before,
    // it's added to the clean string and the seenDot flag is set to true
    else if (original[i] === '.' && !seenDot) {
      clean += original[i];
      seenDot = true;
    }
    // If the character is neither a digit nor the first dot, it's ignored
  }

  // Set the cleaned value to the input element that fired the event
  event.target.value = clean;
};
