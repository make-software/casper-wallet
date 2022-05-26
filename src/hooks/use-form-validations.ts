import * as Yup from 'yup';
import { useTranslation } from 'react-i18next';

type TestAccountNameIsUniqueFunction = (
  value: string | undefined
) => Promise<boolean> | boolean;

export function useFormValidations(
  testAccountNameIsUnique: TestAccountNameIsUniqueFunction
) {
  const { t } = useTranslation();

  const accountNameValidation = Yup.string()
    .required(t('Name is required'))
    .max(20, t("Account name can't be longer than 20 characters"))
    .matches(
      /^[\daA-zZ\s]+$/,
      t('Account name can’t contain special characters')
    )
    .test('unique', t('Account name is already taken'), value =>
      testAccountNameIsUnique(value)
    );

  return { accountNameValidation };
}
