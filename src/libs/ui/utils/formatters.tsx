import { createIntl, createIntlCache, MessageDescriptor } from '@formatjs/intl';
import { formatDistanceToNowStrict, formatISO } from 'date-fns';
import i18next from 'i18next';

import en from 'date-fns/locale/en-US';
import uk from 'date-fns/locale/uk';
import tr from 'date-fns/locale/tr';
import nl from 'date-fns/locale/nl';
import ru from 'date-fns/locale/ru';
import pl from 'date-fns/locale/pl';
import vi from 'date-fns/locale/vi';
import fr from 'date-fns/locale/fr';
import az from 'date-fns/locale/az';

const Locale = {
  en: en,
  uk: uk,
  tr: tr,
  nl: nl,
  ru: ru,
  pl: pl,
  vi: vi,
  fr: fr,
  az: az
};

const cache = createIntlCache();
const intl = createIntl(
  {
    locale: 'en-US',
    messages: {
      'components.transaction_status': 'Success'
    }
  },
  cache
);

export const formatMessage = (
  descriptor: MessageDescriptor,
  values?: Record<string, any>
): string => {
  return intl.formatMessage(descriptor, values);
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
    maximumFractionDigits: precision
  });
};

export const formatPercentage = (
  value: number,
  { precision }: { precision?: number } = {}
) => {
  return value.toFixed(precision || 2);
};

export const formatTimestamp = (value: string): string => {
  const date = new Date(value);
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

export const formatTimestampAge = (value: string): string => {
  const date = new Date(value);
  return `${formatDistanceToNowStrict(date, {
    addSuffix: true,
    // @ts-ignore
    locale: Locale[i18next.language],
    roundingMethod: 'floor'
  })}`;
};

export const formatDate = (value: string): string => {
  const date = new Date(value);
  return `${intl.formatDate(date, {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })}, ${intl.formatTime(date, {
    hour: 'numeric',
    minute: 'numeric'
  })}`;
};

export const formatDateShort = (value: string): string => {
  const date = new Date(value);
  return `${intl.formatDate(date, {
    month: 'short',
    day: 'numeric'
  })}`;
};

export enum HashLength {
  FULL = 0,
  TINY = 5,
  LITTLE = 10,
  SMALL = 15,
  MEDIUM = 20,
  LARGE = 25
}

export const formatHash = (
  hash: string,
  visibleHashLength: HashLength = HashLength.TINY
) => {
  const MIN_TRUNCATE_HASH_LENGTH = HashLength.TINY * 2 + 3;

  const [hashWithoutSuffix, lastDigits] = hash.split('-');

  const hashLength = hashWithoutSuffix.length;

  if (
    visibleHashLength === HashLength.FULL ||
    hashLength <= MIN_TRUNCATE_HASH_LENGTH
  ) {
    return hash;
  }

  const firstPart = hashWithoutSuffix.substring(0, visibleHashLength);
  const secondPart = hashWithoutSuffix.substring(
    hashLength - visibleHashLength
  );

  const truncatedHash = `${firstPart}...${secondPart}`;

  return lastDigits ? `${truncatedHash}-${lastDigits}` : `${truncatedHash}`;
};

export const formatISODateOnly = (date: Date): string => {
  return formatISO(date, {
    representation: 'date'
  });
};
