import * as Yup from 'yup';
import Big from 'big.js';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';

import {
  AuctionManagerEntryPoint,
  DELEGATION_MIN_AMOUNT_MOTES,
  ERROR_DISPLAYED_BEFORE_ATTEMPT_IS_DECREMENTED,
  LOGIN_RETRY_ATTEMPTS_LIMIT,
  MAX_DELEGATORS,
  STAKE_COST_MOTES,
  TRANSFER_COST_MOTES,
  TRANSFER_MIN_AMOUNT_MOTES
} from '@src/constants';
import {
  getErrorMessageForIncorrectPassword,
  isValidPublicKey,
  isValidSecretKeyHash,
  isValidU64
} from '@src/utils';

import { loginRetryCountIncremented } from '@background/redux/login-retry-count/actions';
import { selectLoginRetryCount } from '@background/redux/login-retry-count/selectors';
import { dispatchToMainStore } from '@background/redux/utils';

import { verifyPasswordAgainstHash } from '@libs/crypto/hashing';
import { CSPRtoMotes, motesToCSPR } from '@libs/ui/utils/formatters';

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
  const loginRetryCount = useSelector(selectLoginRetryCount);

  const attemptsLeft =
    LOGIN_RETRY_ATTEMPTS_LIMIT -
    loginRetryCount -
    ERROR_DISPLAYED_BEFORE_ATTEMPT_IS_DECREMENTED;

  const errorMessage = getErrorMessageForIncorrectPassword(attemptsLeft);

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
  const errorMessage = t(
    'There should be 12 or 24 words in a valid secret phrase.'
  );

  return Yup.string().test('unique', errorMessage, value => {
    return (
      value != null &&
      (value.trim().split(' ').length === 24 ||
        value.trim().split(' ').length === 12)
    );
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
      test: value => {
        if (value) {
          return value.endsWith('.cspr') ? true : isValidPublicKey(value);
        }

        return false;
      },
      message: t(
        'The recipient should be a valid public key, CSPR.name or contact name'
      )
    });
};

export const useCSPRTransferAmountRule = (amountMotes: string | null) => {
  const { t } = useTranslation();

  const maxAmountMotes: string =
    amountMotes == null
      ? '0'
      : Big(amountMotes).sub(TRANSFER_COST_MOTES).toFixed();

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
          return Big(CSPRtoMotes(csprAmountInputValue)).lte(maxAmountMotes);
        }

        return false;
      },
      message: t(
        'Your account balance is not high enough. Enter a smaller amount.'
      )
    })
    .test({
      name: 'decimalPartLength',
      test: amountInputValue => {
        if (amountInputValue) {
          const decimalPart = amountInputValue.split('.')[1];
          return decimalPart == null || decimalPart.length <= 9;
        }

        return false;
      },
      message: t('No more than 9 decimals')
    });
};

export const useErc20AmountRule = (
  amount: string | null,
  decimals: number | undefined
) => {
  const { t } = useTranslation();

  const maxAmount: string = amount == null ? '0' : Big(amount).toFixed();

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
    })
    .test({
      name: 'decimalPartLength',
      test: amountInputValue => {
        if (amountInputValue) {
          const decimalPart = amountInputValue.split('.')[1];
          if (decimals || decimals === 0) {
            return decimalPart == null || decimalPart.length <= decimals;
          }

          return true;
        }

        return false;
      },
      message: t(`No more than ${decimals} decimals`)
    });
};

export const usePaymentAmountRule = (csprBalance: string | null) => {
  const { t } = useTranslation();

  const maxAmountMotes: string =
    csprBalance == null ? '0' : Big(csprBalance).toFixed();

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

export const useCSPRStakeAmountRule = (
  amountMotes: string | null,
  mode: AuctionManagerEntryPoint,
  stakeAmountMotes: string
) => {
  const { t } = useTranslation();

  const getStakeMinAmountMotes = () => {
    switch (mode) {
      case AuctionManagerEntryPoint.delegate:
      case AuctionManagerEntryPoint.redelegate: {
        return DELEGATION_MIN_AMOUNT_MOTES;
      }
      case AuctionManagerEntryPoint.undelegate: {
        return '0';
      }

      default: {
        return DELEGATION_MIN_AMOUNT_MOTES;
      }
    }
  };

  const maxAmountMotes: string =
    amountMotes == null
      ? '0'
      : Big(amountMotes).sub(STAKE_COST_MOTES).toFixed();

  return Yup.string()
    .required({
      header: t('Amount is required'),
      description: t('You need to enter an amount to stake')
    })
    .test({
      name: 'validU64',
      test: csprAmountInputValue => {
        if (csprAmountInputValue) {
          return isValidU64(csprAmountInputValue);
        }

        return false;
      },
      message: {
        header: t(`Amount is invalid`),
        description: t(`You need to enter a valid amount`)
      }
    })
    .test({
      name: 'amountBelowMinTransfer',
      test: csprAmountInputValue => {
        if (csprAmountInputValue) {
          return Big(CSPRtoMotes(csprAmountInputValue)).gte(
            getStakeMinAmountMotes()
          );
        }

        return false;
      },
      message:
        mode === AuctionManagerEntryPoint.delegate
          ? {
              header: t('You can’t delegate this amount'),
              description: t(
                `The minimum required delegation amount is ${motesToCSPR(
                  getStakeMinAmountMotes()
                )} CSPR.`
              )
            }
          : {
              header: t('You can’t redelegate this amount'),
              description: t(
                `The minimum required redelegation amount is ${motesToCSPR(
                  getStakeMinAmountMotes()
                )} CSPR.`
              )
            }
    })
    .test({
      name: 'amountAboveBalance',
      test: csprAmountInputValue => {
        if (csprAmountInputValue) {
          switch (mode) {
            case AuctionManagerEntryPoint.undelegate: {
              return Big(CSPRtoMotes(csprAmountInputValue)).lte(
                Big(stakeAmountMotes).sub(getStakeMinAmountMotes()).toFixed()
              );
            }
            case AuctionManagerEntryPoint.redelegate: {
              return Big(CSPRtoMotes(csprAmountInputValue)).lte(
                Big(stakeAmountMotes).toFixed()
              );
            }
            case AuctionManagerEntryPoint.delegate:
            default: {
              return Big(CSPRtoMotes(csprAmountInputValue)).lte(maxAmountMotes);
            }
          }
        }

        return false;
      },
      message:
        mode === AuctionManagerEntryPoint.undelegate
          ? {
              header: t('You can’t undelegate this amount'),
              description: t('Amount must be less than staked CSPR.')
            }
          : mode === AuctionManagerEntryPoint.redelegate
            ? {
                header: t('You can’t redelegate this amount'),
                description: t('Amount must be less than staked CSPR.')
              }
            : {
                header: t('Your account balance is not high enough'),
                description: t(
                  'Your account balance is not high enough. Enter a smaller amount.'
                )
              }
    });
};

export const useValidatorPublicKeyRule = (
  stakeType: AuctionManagerEntryPoint,
  delegatorsNumber?: number,
  hasDelegationToSelectedValidator?: boolean
) => {
  const { t } = useTranslation();

  return Yup.string()
    .required(t('Recipient is required'))
    .test({
      name: 'validatorPublicKey',
      test: value => (value ? isValidPublicKey(value) : false),
      message: t('Recipient should be a valid public key')
    })
    .test({
      name: 'maxDelegators',
      test: () => {
        if (
          stakeType === AuctionManagerEntryPoint.undelegate ||
          stakeType === AuctionManagerEntryPoint.redelegate
        ) {
          return true;
        }
        if (
          (delegatorsNumber === 0 || delegatorsNumber) &&
          !hasDelegationToSelectedValidator
        ) {
          return delegatorsNumber < MAX_DELEGATORS;
        }

        return !!hasDelegationToSelectedValidator;
      },
      message: t(
        'This validator has reached the network limit for total delegators and therefore cannot be delegated to by new accounts. Please select another validator with fewer than 1200 total delegators'
      )
    });
};

export const useNewValidatorPublicKeyRule = (
  delegatorsNumber?: number,
  hasDelegationToSelectedNewValidator?: boolean
) => {
  const { t } = useTranslation();

  return Yup.string()
    .required(t('Recipient is required'))
    .test({
      name: 'newValidatorPublicKey',
      test: value => (value ? isValidPublicKey(value) : false),
      message: t('Recipient should be a valid public key')
    })
    .test({
      name: 'maxDelegators',
      test: () => {
        if (
          (delegatorsNumber === 0 || delegatorsNumber) &&
          !hasDelegationToSelectedNewValidator
        ) {
          return delegatorsNumber < MAX_DELEGATORS;
        }

        return !!hasDelegationToSelectedNewValidator;
      },
      message: t(
        'This validator has reached the network limit for total delegators and therefore cannot be delegated to by new accounts. Please select another validator with fewer than 1200 total delegators'
      )
    });
};

export const useContactNameRule = (
  isContactNameIsTakenCallback: (
    value: string | undefined
  ) => Promise<boolean> | boolean
) => {
  const { t } = useTranslation();

  return Yup.string()
    .required(t('Name is required'))
    .max(20, t('This name is too long. Let’s keep it within 20 characters'))
    .test(
      'empty',
      t("Name can't be empty"),
      value => value != null && value.trim() !== ''
    )
    .test(
      'unique',
      t(
        'You’ve already got a contact with this name. Please find a new name for this one'
      ),
      value => isContactNameIsTakenCallback(value)
    );
};

export const useContactPublicKeyRule = () => {
  const { t } = useTranslation();

  return Yup.string()
    .required(t('Public address is required'))
    .test({
      name: 'contactPublicKey',
      test: value => (value ? isValidPublicKey(value) : false),
      message: t('Public address should be a valid public key')
    });
};

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

export const useBuyCSPRKeyRule = () => {
  const { t } = useTranslation();

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
    });
};
