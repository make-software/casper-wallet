import { formatNumber } from 'casper-wallet-core';
import { ValidatorDto } from 'casper-wallet-core/src/data/dto/validators';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { AuctionManagerEntryPoint } from '@src/constants';

import { useTypedLocation } from '@popup/router';

import { useFetchValidators } from '@libs/services/validators-service';
import { motesToCSPR } from '@libs/ui/utils';

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
  validatorList: ValidatorDto[] | null
) => {
  return useMemo(() => {
    if (!validatorList) return [];
    if (!inputValue) return validatorList;

    const lowerCaseInput = inputValue.toLowerCase();

    const isIncluded = (stringToCheck: string | undefined) =>
      stringToCheck?.toLowerCase().includes(lowerCaseInput);

    return validatorList.filter(validator => {
      const { publicKey } = validator;
      const ownerName = validator?.name;

      return isIncluded(ownerName) || isIncluded(publicKey);
    });
  }, [inputValue, validatorList]);
};

export const useStakeActionTexts = (
  stakeType: AuctionManagerEntryPoint,
  maxAmountMotesForStaking?: string
) => {
  const [state, setState] = useState<StakeTexts>({
    ...stakeActionsTextMap[stakeType],
    amountStepMaxAmountValue: null
  });

  useEffect(() => {
    const formattedAmountCSPR =
      maxAmountMotesForStaking &&
      formatNumber(motesToCSPR(maxAmountMotesForStaking), {
        precision: { max: 4 }
      });

    setState({
      ...stakeActionsTextMap[stakeType],
      amountStepMaxAmountValue:
        stakeType !== AuctionManagerEntryPoint.delegate
          ? `${formattedAmountCSPR} CSPR`
          : null
    });
  }, [maxAmountMotesForStaking, stakeType]);

  return state;
};

export const useConfirmationButtonText = (
  stakeType: AuctionManagerEntryPoint
) => {
  const { t } = useTranslation();

  const buttonTexts = {
    [AuctionManagerEntryPoint.delegate]: t('Confirm delegation'),
    [AuctionManagerEntryPoint.undelegate]: t('Confirm undelegation'),
    [AuctionManagerEntryPoint.redelegate]: t('Confirm redelegation'),
    default: t('Confirm')
  };

  return buttonTexts[stakeType] || buttonTexts.default;
};

export const useStakeType = () => {
  const [stakeType, setStakeType] = useState<AuctionManagerEntryPoint>(
    AuctionManagerEntryPoint.delegate
  );
  const [validatorList, setValidatorList] = useState<ValidatorDto[] | null>(
    null
  );
  const [undelegateValidatorList, setUndelegateValidatorList] = useState<
    ValidatorDto[] | null
  >(null);

  const { pathname } = useTypedLocation();

  const {
    validators,
    validatorsWithStakes,
    isLoadingValidatorsWithStakes,
    isLoadingValidators
  } = useFetchValidators();

  useEffect(() => {
    const name = pathname.split('/')[1];
    // checking pathname to know what type of stake it is
    if (
      name === AuctionManagerEntryPoint.delegate ||
      name === AuctionManagerEntryPoint.redelegate
    ) {
      setStakeType(name);
      setValidatorList(validators?.data ?? []);
      setUndelegateValidatorList(validatorsWithStakes);
    } else if (name === AuctionManagerEntryPoint.undelegate) {
      setStakeType(name);
      setUndelegateValidatorList(validatorsWithStakes);
    }
  }, [pathname, validators, validatorsWithStakes]);

  return {
    stakeType,
    validatorList,
    undelegateValidatorList,
    loading: !(!isLoadingValidators && !isLoadingValidatorsWithStakes)
  };
};
