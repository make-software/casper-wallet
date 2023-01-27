import * as Yup from 'yup';
import { useTranslation } from 'react-i18next';
import { verifyPasswordAgainstHash } from '@src/libs/crypto/hashing';
import { dispatchToMainStore } from '@src/background/redux/utils';
import { loginRetryCountIncrement } from '@src/background/redux/login-retry-count/actions';

export const minPasswordLength = 16;

export function useCreatePasswordRule() {
  const { t } = useTranslation();
  const passwordAmountCharactersMessage = t(
    `Should be at least ${minPasswordLength} characters`
  );

  return Yup.string().min(minPasswordLength, passwordAmountCharactersMessage);
}

export function useVerifyPasswordAgainstHashRule(
  passwordHash: string,
  passwordSaltHash: string
) {
  const { t } = useTranslation();
  const errorMessage = t('Password is not correct');

  return Yup.string().test('authenticate', errorMessage, async password => {
    const result = await verifyPasswordAgainstHash(
      passwordHash,
      passwordSaltHash,
      password
    );
    if (result === false) {
      dispatchToMainStore(loginRetryCountIncrement());
    }
    return result;
  });
}

export function useRepeatPasswordRule(inputName: string) {
  const { t } = useTranslation();
  const passwordsDoesntMatchMessage = t("Passwords don't match");

  return Yup.string().oneOf([Yup.ref(inputName)], passwordsDoesntMatchMessage);
}

export function useValidSecretPhraseRule() {
  const { t } = useTranslation();
  const errorMessage = t('There should be 24 words in a valid secret phrase.');

  return Yup.string().test('unique', errorMessage, value => {
    return value != null && value.trim().split(' ').length === 24;
  });
}

export function useAccountNameRule(
  isAccountNameIsTakenCallback: (
    value: string | undefined
  ) => Promise<boolean> | boolean
) {
  const { t } = useTranslation();

  return Yup.string()
    .required(t('Name is required'))
    .max(20, t("Account name can't be longer than 20 characters"))
    .matches(
      /^[\daA-zZ\s]+$/,
      t('Account name can’t contain special characters')
    )
    .test(
      'empty',
      t("Name can't be empty"),
      value => value != null && value.trim() !== ''
    )
    .test('unique', t('Account name is already taken'), value =>
      isAccountNameIsTakenCallback(value)
    );
}
