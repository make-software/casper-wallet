import { createIntl, createIntlCache } from '@formatjs/intl';
import Big from 'big.js';
// eslint-disable-next-line import/no-duplicates
import { formatDistanceToNowStrict } from 'date-fns';
// eslint-disable-next-line import/no-duplicates
import en from 'date-fns/locale/en-US';

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
  return Big(motes).div(MOTES_PER_CSPR_RATE).toString();
};

export const CSPRtoMotes = (cspr: string): string => {
  return Big(cspr).mul(MOTES_PER_CSPR_RATE).toString();
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
  return Big(balance).div(tokenDivider(decimals)).toString();
};

export const multiplyErc20Balance = (
  balance: string | null,
  decimals: number | null
): string | null => {
  if (balance == null) {
    return null;
  }
  return Big(balance).mul(tokenDivider(decimals)).toString();
};

export const motesToCurrency = (
  motes: string,
  currencyPerCsprRate: number
): string => {
  if (currencyPerCsprRate === 0) {
    throw new Error('motesToCurrency: the CSPR rate cannot be zero');
  }

  const amount = Big(motes).div(MOTES_PER_CSPR_RATE).mul(currencyPerCsprRate);

  const billion = new Big(10).pow(9);

  if (amount.gte(billion)) {
    // If the value is greater than or equal to 10^9, return one billion string.
    return '1000000000';
  }

  return amount.toString();
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
  value: string,
  code: string,
  {
    precision
  }: {
    precision?: number;
  } = {}
): string => {
  const formattedValue = intl.formatNumber(Number(value), {
    style: 'currency',
    currency: code,
    minimumFractionDigits: precision,
    maximumFractionDigits: precision
  });
  // Check if the original value is '1000000000'
  // If yes, append a '+' sign to the end of the formatted value
  // Otherwise, return the formatted value as is
  return value === '1000000000' ? `${formattedValue}+` : formattedValue;
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
