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