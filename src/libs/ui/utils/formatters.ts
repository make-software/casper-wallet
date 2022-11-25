import Big from 'big.js';
import { createIntl, createIntlCache } from '@formatjs/intl';

import { MOTES_PER_CSPR_RATE } from '@libs/ui/utils/constants';

const cache = createIntlCache();
const intl = createIntl(
  {
    // TODO: should implement using active lang from i18n
    locale: 'en-US',
    messages: {}
  },
  cache
);

export const formatTimestamp = (value: string): string => {
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

export const formatNumber = (
  value: number | string,
  {
    precision,
    notation,
    compactDisplay
  }: {
    precision?: number;
    notation?: 'compact' | 'standard';
    compactDisplay?: 'short' | 'long';
  } = {}
): string => {
  return intl.formatNumber(value as number, {
    minimumFractionDigits: precision || 0,
    maximumFractionDigits: precision || 0,
    notation,
    compactDisplay
  });
};

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

export const motesToCurrency = (
  motes: string,
  currencyPerCsprRate: number
): string => {
  if (currencyPerCsprRate === 0) {
    throw new Error('motesToCurrency: the CSPR rate cannot be zero');
  }

  return Big(motes)
    .div(MOTES_PER_CSPR_RATE)
    .mul(currencyPerCsprRate)
    .toString();
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

export const balanceFormatter = (amount: string, isCSPR = false): string => {
  let result = '';

  const roundedAmount = Number(amount).toFixed(2);
  const firstPartOfAmount = roundedAmount.split('.')[0];
  const secondPartOfAmount = roundedAmount.split('.')[1];

  const reverseStr = firstPartOfAmount.split('').reverse().join('');
  const length = firstPartOfAmount.length;

  if (length >= 4) {
    for (let i = length - 1; i >= 0; i--) {
      if (i % 3 === 0 && i !== 0) {
        result += `${reverseStr[i]},`;
      } else {
        result += reverseStr[i];
      }
    }
  } else {
    result = firstPartOfAmount;
  }

  if (!isCSPR || secondPartOfAmount !== '00') {
    result += `.${secondPartOfAmount}`;
  }

  return result;
};
