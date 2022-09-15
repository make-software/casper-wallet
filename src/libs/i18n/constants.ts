export enum LangCode {
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

export const EnabledLanguages: string[] = [LangCode.EN];

export const LangFlags = {
  [LangCode.EN]: 'assets/icons/flags/ic-flag-en.svg',
  [LangCode.AZ]: 'assets/icons/flags/ic-flag-az.svg',
  [LangCode.ES]: 'assets/icons/flags/ic-flag-es.svg',
  [LangCode.FR]: 'assets/icons/flags/ic-flag-fr.svg',
  [LangCode.NL]: 'assets/icons/flags/ic-flag-nl.svg',
  [LangCode.PL]: 'assets/icons/flags/ic-flag-pl.svg',
  [LangCode.RU]: 'assets/icons/flags/ic-flag-ru.svg',
  [LangCode.VT]: 'assets/icons/flags/ic-flag-vt.svg'
};
