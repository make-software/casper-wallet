import * as Yup from 'yup';
import Big from 'big.js';
import { CSPR_COIN } from 'casper-wallet-core/src/domain/constants/casperNetwork';
import { formatTokenBalance } from 'casper-wallet-core/src/utils/common';
import { useTranslation } from 'react-i18next';

import {
  AuctionManagerEntryPoint,
  DELEGATION_MIN_AMOUNT_MOTES,
  MAX_DELEGATORS,
  STAKE_COST_MOTES,
  TRANSFER_COST_MOTES,
  TRANSFER_MIN_AMOUNT_MOTES
} from '@src/constants';
import {
  getErrorMessageForIncorrectPassword,
  isValidPublicKey,
  isValidU64
} from '@src/utils';

import {
  UnlockResult,
  VERIFY_PASSWORD_REQUEST_TYPE
} from '@background/handlers/unlock-requests';

import { requestOverPort } from '@libs/messaging/background-port';
import { CSPRtoMotes, motesToCSPR } from '@libs/ui/utils/formatters';

export const minPasswordLength = 16;

export function useCreatePasswordRule() {
  const { t } = useTranslation();
  const passwordAmountCharactersMessage = t(
    `Should be at least ${minPasswordLength} characters`
  );
  const passwordIsRequiredMessage = t('Password is required');

  return Yup.string()
    .required(passwordIsRequiredMessage)
    .min(minPasswordLength, passwordAmountCharactersMessage);
}

export function useVerifyPasswordAgainstHashRule() {
  const { t } = useTranslation();
  const passwordIsRequiredMessage = t('Password is required');
  const genericErrorMessage = t('Something went wrong. Please try again.');

  return Yup.string()
    .required(passwordIsRequiredMessage)
    .test('authenticate', genericErrorMessage, async function (password) {
      try {
        const result = await requestOverPort<UnlockResult>({
          type: VERIFY_PASSWORD_REQUEST_TYPE,
          payload: { password: password ?? '', attemptId: crypto.randomUUID() }
        });

        if (result.status === 'ok') {
          return true;
        }

        if (result.status === 'wrong') {
          return this.createError({
            message: t(getErrorMessageForIncorrectPassword(result.attemptsLeft))
          });
        }

        // 'lockedOut' and 'error' both fall through to the generic message —
        // neither is a wrong password, and the onboarding page has no lockout
        // screen of its own to route to.
        return this.createError({ message: genericErrorMessage });
      } catch (error) {
        // The password is in scope and is deliberately not referenced.
        console.error('Password verification failed:', error);
        return this.createError({ message: genericErrorMessage });
      }
    });
}

export function useRepeatPasswordRule(inputName: string) {
  const { t } = useTranslation();
  const passwordsDoesntMatchMessage = t("Passwords don't match");
  const confirmPasswordIsRequiredMessage = t('Confirm password is required');

  return Yup.string()
    .required(confirmPasswordIsRequiredMessage)
    .oneOf([Yup.ref(inputName)], passwordsDoesntMatchMessage);
}

export function useValidSecretPhraseRule() {
  const { t } = useTranslation();
  const errorMessage = t(
    'There should be 12 or 24 words in a valid secret phrase.'
  );
  const secretPhraseIsRequiredMessage = t('Secret phrase is required');

  return Yup.string()
    .required(secretPhraseIsRequiredMessage)
    .test('unique', errorMessage, value => {
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
      /^[\da-zA-Z_\s]+$/,
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

export const useCSPRTransferAmountRule = (amountMotes: string | undefined) => {
  const { t } = useTranslation();

  const maxAmountMotes: string = !amountMotes
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

export const usePaymentAmountRule = (csprBalance: string | undefined) => {
  const { t } = useTranslation();

  const maxAmountMotes: string = !csprBalance
    ? '0'
    : Big(csprBalance).toFixed();

  return Yup.string()
    .required(t('Transaction payment is required'))
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
  amountMotes: string | undefined,
  mode: AuctionManagerEntryPoint,
  maxAmountMotesForStaking: string,
  validatorMinAmount: string,
  validatorMaxAmount: string
) => {
  const { t } = useTranslation();

  const getStakeMinAmountMotes = () => {
    switch (mode) {
      case AuctionManagerEntryPoint.delegate:
      case AuctionManagerEntryPoint.redelegate: {
        return validatorMinAmount;
      }
      case AuctionManagerEntryPoint.undelegate: {
        return '0';
      }

      default: {
        return DELEGATION_MIN_AMOUNT_MOTES;
      }
    }
  };

  const maxAmountMotes: string = !amountMotes
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
                Big(maxAmountMotesForStaking)
                  .sub(getStakeMinAmountMotes())
                  .toFixed()
              );
            }
            case AuctionManagerEntryPoint.redelegate: {
              return Big(CSPRtoMotes(csprAmountInputValue)).lte(
                Big(maxAmountMotesForStaking).toFixed()
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
    })
    .test({
      name: 'amountAboveValidatorMaxAmount',
      test: csprAmountInputValue => {
        if (csprAmountInputValue) {
          switch (mode) {
            case AuctionManagerEntryPoint.delegate:
            case AuctionManagerEntryPoint.redelegate:
              return Big(CSPRtoMotes(csprAmountInputValue)).lte(
                validatorMaxAmount
              );
            default: {
              return true;
            }
          }
        }

        return false;
      },
      message: {
        header: t('You cannot delegate this amount'),
        description: t(
          `Delegation amount for this validator cannot be more than ${formatTokenBalance(
            validatorMaxAmount,
            CSPR_COIN.decimals
          )} CSPR.`
        )
      }
    });
};

export const useValidatorPublicKeyRule = (
  stakeType: AuctionManagerEntryPoint,
  delegatorsNumber?: number,
  hasDelegationToSelectedValidator?: boolean,
  reservedSlots = 0
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
          return delegatorsNumber + reservedSlots < MAX_DELEGATORS;
        }

        return !!hasDelegationToSelectedValidator;
      },
      message: {
        header: t('This validator has max delegators'),
        description: t(
          'This validator has reached the network limit for total delegators and therefore cannot be delegated to by new accounts. Please select another validator with fewer than 1200 total delegators'
        )
      }
    });
};

export const useNewValidatorPublicKeyRule = (
  inputAmountCspr: string,
  minAmountForNewValidator: string,
  maxAmountForNewValidator: string,
  reservedSlotsForNewValidator: number,
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
          return (
            delegatorsNumber + reservedSlotsForNewValidator < MAX_DELEGATORS
          );
        }

        return !!hasDelegationToSelectedNewValidator;
      },
      message: {
        header: t('This validator has max delegators'),
        description: t(
          'This validator has reached the network limit for total delegators and therefore cannot be delegated to by new accounts. Please select another validator with fewer than 1200 total delegators'
        )
      }
    })
    .test({
      name: 'amountBelowMinTransfer',
      test: () =>
        Big(CSPRtoMotes(inputAmountCspr || '0')).gte(minAmountForNewValidator),
      message: {
        header: t('You can’t redelegate this amount'),
        description: t(
          `The minimum required redelegation amount is ${formatTokenBalance(
            minAmountForNewValidator,
            CSPR_COIN.decimals
          )} CSPR.`
        )
      }
    })
    .test({
      name: 'amountAboveValidatorMaxAmount',
      test: () =>
        Big(CSPRtoMotes(inputAmountCspr) || '0').lte(maxAmountForNewValidator),
      message: {
        header: t('You cannot delegate this amount'),
        description: t(
          `Delegation amount for this validator cannot be more than ${formatTokenBalance(
            maxAmountForNewValidator,
            CSPR_COIN.decimals
          )} CSPR.`
        )
      }
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
    .matches(
      /^[\da-zA-Z_\s]+$/,
      t('Contact name can’t contain special characters')
    )
    .test(
      'unique',
      t(
        'You’ve already got an account / contact with this name. Please find a new name for this one'
      ),
      value => isContactNameIsTakenCallback(value)
    );
};

export const useContactPublicKeyRule = (
  isPublicKeyAlreadyInContactsCallback: (
    value: string | undefined
  ) => Promise<boolean> | boolean
) => {
  const { t } = useTranslation();

  return Yup.string()
    .required(t('Public address is required'))
    .test({
      name: 'contactPublicKey',
      test: value => (value ? isValidPublicKey(value) : false),
      message: t('Public address should be a valid public key')
    })
    .test(
      'unique',
      t('You’ve already got a contact with this public key'),
      value => isPublicKeyAlreadyInContactsCallback(value)
    );
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
