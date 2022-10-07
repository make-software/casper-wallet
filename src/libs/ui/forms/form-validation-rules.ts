import * as Yup from 'yup';
import { useTranslation } from 'react-i18next';

export const minPasswordLength = 12;

export function usePasswordRule() {
  const { t } = useTranslation();
  const passwordAmountCharactersMessage = t(
    `Should be at least ${minPasswordLength} characters`
  );

  return Yup.string().min(minPasswordLength, passwordAmountCharactersMessage);
}

export function useConfirmPasswordRule(targetKey: string) {
  const { t } = useTranslation();
  const passwordsDoesntMatchMessage = t("Passwords don't match");

  return Yup.string().oneOf([Yup.ref(targetKey)], passwordsDoesntMatchMessage);
}

export function usePhraseRule() {
  const { t } = useTranslation();

  return Yup.string().test(
    'unique',
    t('There should be 24 words in a valid secret phrase.'),
    value => value != null && value.trim().split(' ').length === 24
  );
}
