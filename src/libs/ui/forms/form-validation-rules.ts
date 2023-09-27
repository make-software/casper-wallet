import * as Yup from 'yup';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import Big from 'big.js';

import { verifyPasswordAgainstHash } from '@src/libs/crypto/hashing';
import { dispatchToMainStore } from '@src/background/redux/utils';
import { loginRetryCountIncremented } from '@src/background/redux/login-retry-count/actions';
import { selectLoginRetryCount } from '@background/redux/login-retry-count/selectors';
import {
  LOGIN_RETRY_ATTEMPTS_LIMIT,
  TRANSFER_MIN_AMOUNT_MOTES,
  TRANSFER_COST_MOTES
} from '@src/constants';
import { isValidPublicKey, isValidU64 } from '@src/utils';
import { CSPRtoMotes, motesToCSPR } from '@libs/ui/utils/formatters';

export const minPasswordLength = 16;
export const maxQrCodePasswordLength = 8;

const ERROR_DISPLAYED_BEFORE_ATTEMPT_IS_DECREMENTED = 1;

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
  const loginRetryCount = useSelector(selectLoginRetryCount);

  const attemptsLeft =
    LOGIN_RETRY_ATTEMPTS_LIMIT -
    loginRetryCount -
    ERROR_DISPLAYED_BEFORE_ATTEMPT_IS_DECREMENTED;

  const errorMessage =
    attemptsLeft === 1
      ? t(
          'Password is incorrect. You’ve got last attempt, after that you’ll have to wait for 5 mins'
        )
      : t(
          `Password is incorrect. You’ve got ${attemptsLeft} attempts, after that you’ll have to wait for 5 mins`
        );

  return Yup.string().test('authenticate', errorMessage, async password => {
    const result = await verifyPasswordAgainstHash(
      passwordHash,
      passwordSaltHash,
      password
    );

    if (!result) {
      dispatchToMainStore(loginRetryCountIncremented());
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

export const useTransferIdMemoRule = () => {
  const { t } = useTranslation();

  return Yup.string().test({
    name: 'validU64',
    // this field is optional, so we set it to true if it's empty
    test: value => (value ? isValidU64(value) : true),
    message: t(`Transfer ID is invalid`)
  });
};

export const useRecipientPublicKeyRule = () => {
  const { t } = useTranslation();

  return Yup.string()
    .required(t('Recipient is required'))
    .test({
      name: 'recipientPublicKey',
      test: value => (value ? isValidPublicKey(value) : false),
      message: t('Recipient should be a valid public key')
    });
};

export const useCsprAmountRule = (amountMotes: string | null) => {
  const { t } = useTranslation();

  const maxAmountMotes: string =
    amountMotes == null
      ? '0'
      : Big(amountMotes).sub(TRANSFER_COST_MOTES).toString();

  return Yup.string()
    .required(t('Amount is required'))
    .test({
      name: 'validU64',
      test: csprAmountInputValue => {
        if (csprAmountInputValue) {
          return isValidU64(csprAmountInputValue);
        }

        return false;
      },
      message: t(`Amount is invalid`)
    })
    .test({
      name: 'amountBelowMinTransfer',
      test: csprAmountInputValue => {
        if (csprAmountInputValue) {
          return Big(CSPRtoMotes(csprAmountInputValue)).gte(
            TRANSFER_MIN_AMOUNT_MOTES
          );
        }

        return false;
      },
      message: t(
        `Amount must be at least ${motesToCSPR(
          TRANSFER_MIN_AMOUNT_MOTES
        )} CSPR.`
      )
    })
    .test({
      name: 'amountAboveBalance',
      test: csprAmountInputValue => {
        if (csprAmountInputValue) {
          return Big(CSPRtoMotes(csprAmountInputValue)).lt(maxAmountMotes);
        }

        return false;
      },
      message: t(
        'Your account balance is not high enough. Enter a smaller amount.'
      )
    });
};

export const useErc20AmountRule = (amount: string | null) => {
  const { t } = useTranslation();

  const maxAmount: string = amount == null ? '0' : Big(amount).toString();

  return Yup.string()
    .required(t('Amount is required'))
    .test({
      name: 'validU64',
      test: amountInputValue => {
        if (amountInputValue) {
          return isValidU64(amountInputValue);
        }

        return false;
      },
      message: t(`Amount is invalid`)
    })
    .test({
      name: 'amountBelowMinTransfer',
      test: amountInputValue => {
        if (amountInputValue) {
          return Big(amountInputValue).gt('0');
        }

        return false;
      },
      message: t(`Amount must be greater than zero.`)
    })
    .test({
      name: 'amountAboveBalance',
      test: amountInputValue => {
        if (amountInputValue) {
          return Big(amountInputValue).lte(maxAmount);
        }

        return false;
      },
      message: t(
        'Your account balance is not high enough. Enter a smaller amount.'
      )
    });
};

export const usePaymentAmountRule = (csprBalance: string | null) => {
  const { t } = useTranslation();

  const maxAmountMotes: string =
    csprBalance == null ? '0' : Big(csprBalance).toString();

  return Yup.string()
    .required(t('Payment amount is required'))
    .test({
      name: 'validU64',
      test: amountInputValue => {
        if (amountInputValue) {
          return isValidU64(amountInputValue);
        }

        return false;
      },
      message: t(`Amount is invalid`)
    })
    .test({
      name: 'amountBelowMinTransfer',
      test: amountInputValue => {
        if (amountInputValue) {
          return Big(amountInputValue).gt('0');
        }

        return false;
      },
      message: t(`Amount must be greater than zero.`)
    })
    .test({
      name: 'amountAboveBalance',
      test: amountInputValue => {
        if (amountInputValue) {
          return Big(CSPRtoMotes(amountInputValue)).lt(maxAmountMotes);
        }

        return false;
      },
      message: t(
        'Your account balance is not high enough. Enter a smaller amount.'
      )
    });
};
