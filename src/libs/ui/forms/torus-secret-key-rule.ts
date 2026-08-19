import * as Yup from 'yup';
import { useTranslation } from 'react-i18next';

import { isValidSecretKeyHash } from '@libs/crypto/is-valid-secret-key-hash';

// Kept out of form-validation-rules.ts on purpose: that module is on the eager startup
// path of the onboarding entry, and isValidSecretKeyHash value-imports casper-js-sdk.
export const useTorusSecretKeyRule = () => {
  const { t } = useTranslation();

  return Yup.string()
    .required(t('Secret key is required'))
    .test({
      name: 'secret key',
      test: value => (value ? isValidSecretKeyHash(value) : false),
      message: t('This secret key doesn’t look right')
    });
};
