import { createIntl, createIntlCache } from '@formatjs/intl';

const cache = createIntlCache();
const intl = createIntl(
  {
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
