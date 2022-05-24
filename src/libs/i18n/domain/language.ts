export enum Lang {
  EN = 'en',
  AZ = 'az',
  ES = 'es',
  FR = 'fr',
  NL = 'nl',
  PL = 'pl',
  RU = 'ru',
  TR = 'tr',
  UA = 'ua',
  VT = 'vt'
}

export const LangRegion = {
  [Lang.EN]: 'EN',
  [Lang.AZ]: 'AZ',
  [Lang.ES]: 'ES',
  [Lang.FR]: 'FR',
  [Lang.NL]: 'NL',
  [Lang.PL]: 'PL',
  [Lang.RU]: 'RU',
  [Lang.VT]: 'VT',
  [Lang.TR]: 'TR',
  [Lang.UA]: 'UA'
};

export const ActiveLanguages = [
  Lang.EN,
  Lang.AZ,
  Lang.ES,
  Lang.FR,
  Lang.NL,
  Lang.PL,
  Lang.RU,
  Lang.TR,
  Lang.UA,
  Lang.VT
];

export const CustomLangFlags = {
  [Lang.EN]: 'assets/icons/flags/ic-flag-en.svg',
  [Lang.AZ]: 'assets/icons/flags/ic-flag-az.svg',
  [Lang.ES]: 'assets/icons/flags/ic-flag-es.svg',
  [Lang.FR]: 'assets/icons/flags/ic-flag-fr.svg',
  [Lang.NL]: 'assets/icons/flags/ic-flag-nl.svg',
  [Lang.PL]: 'assets/icons/flags/ic-flag-pl.svg',
  [Lang.RU]: 'assets/icons/flags/ic-flag-ru.svg',
  [Lang.VT]: 'assets/icons/flags/ic-flag-vt.svg'
};

export const ReactLangFlags = {
  [Lang.TR]: 'tr',
  [Lang.UA]: 'ua'
};
