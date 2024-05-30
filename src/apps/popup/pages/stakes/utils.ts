import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { AuctionManagerEntryPoint } from '@src/constants';

import { ValidatorResultWithId } from '@libs/services/validators-service';
import { formatNumber, motesToCSPR } from '@libs/ui/utils';

type StakeTexts = {
  validatorStepHeaderText: string;
  newValidatorStepHeaderText?: string;
  amountStepHeaderText: string;
  confirmStepHeaderText: string;
  successStepHeaderText: string;
  confirmStepText: string;
  amountStepText: string;
  amountStepMaxAmountValue: string | null;
};

type StakeActionTextMap = Record<
  AuctionManagerEntryPoint,
  Omit<StakeTexts, 'amountStepMaxAmountValue'>
>;

const stakeActionsTextMap: StakeActionTextMap = {
  [AuctionManagerEntryPoint.delegate]: {
    validatorStepHeaderText: 'Delegate',
    amountStepHeaderText: 'Delegate amount',
    confirmStepHeaderText: 'Confirm delegation',
    successStepHeaderText: 'You’ve submitted a delegation',
    amountStepText: 'Delegate max',
    confirmStepText: 'You’ll delegate'
  },
  [AuctionManagerEntryPoint.undelegate]: {
    validatorStepHeaderText: 'Undelegate',
    amountStepHeaderText: 'Undelegate amount',
    confirmStepHeaderText: 'Confirm undelegation',
    successStepHeaderText: 'You’ve submitted an undelegation',
    amountStepText: 'Undelegate max:',
    confirmStepText: 'You’ll undelegate'
  },
  [AuctionManagerEntryPoint.redelegate]: {
    validatorStepHeaderText: 'Redelegate',
    amountStepHeaderText: 'Redelegate amount',
    newValidatorStepHeaderText: 'Delegate',
    confirmStepHeaderText: 'Confirm redelegation',
    successStepHeaderText: 'You’ve submitted a redelegation',
    amountStepText: 'Redelegate max:',
    confirmStepText: 'You’ll redelegate'
  }
};

export const useFilteredValidators = (
  inputValue: string | undefined,
  validatorList: ValidatorResultWithId[] | null
) => {
  const filterValidators = useCallback(
    (
      inputValue: string | undefined,
      validatorList: ValidatorResultWithId[] | null
    ): ValidatorResultWithId[] | [] => {
      if (!validatorList) return [];
      if (!inputValue) return validatorList;

      const lowerCaseInput = inputValue.toLowerCase();

      const isIncluded = (stringToCheck: string | undefined) =>
        stringToCheck?.toLowerCase().includes(lowerCaseInput);

      return validatorList.filter(validator => {
        const { public_key } = validator;
        const ownerName = validator?.account_info?.info?.owner?.name;

        return isIncluded(ownerName) || isIncluded(public_key);
      });
    },
    []
  );

  return filterValidators(inputValue, validatorList);
};

export const useStakeActionTexts = (
  stakesType: AuctionManagerEntryPoint,
  stakeAmountMotes?: string
) => {
  const [state, setState] = useState<StakeTexts>({
    ...stakeActionsTextMap[stakesType],
    amountStepMaxAmountValue: null
  });

  useEffect(() => {
    const formattedAmountCSPR =
      stakeAmountMotes &&
      formatNumber(motesToCSPR(stakeAmountMotes), { precision: { max: 4 } });

    setState({
      ...stakeActionsTextMap[stakesType],
      amountStepMaxAmountValue:
        stakesType !== AuctionManagerEntryPoint.delegate
          ? `${formattedAmountCSPR} CSPR`
          : null
    });
  }, [stakeAmountMotes, stakesType]);

  return state;
};

export const useConfirmationButtonText = (
  stakesType: AuctionManagerEntryPoint
) => {
  const { t } = useTranslation();

  const buttonTexts = {
    [AuctionManagerEntryPoint.delegate]: t('Confirm delegation'),
    [AuctionManagerEntryPoint.undelegate]: t('Confirm undelegation'),
    [AuctionManagerEntryPoint.redelegate]: t('Confirm redelegation'),
    default: t('Confirm')
  };

  return buttonTexts[stakesType] || buttonTexts.default;
};
