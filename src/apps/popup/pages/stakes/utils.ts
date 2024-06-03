import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';

import { AuctionManagerEntryPoint } from '@src/constants';

import { useTypedLocation } from '@popup/router';

import { selectApiConfigBasedOnActiveNetwork } from '@background/redux/settings/selectors';
import { selectVaultActiveAccount } from '@background/redux/vault/selectors';

import {
  ValidatorResultWithId,
  dispatchFetchAuctionValidatorsRequest,
  dispatchFetchValidatorsDetailsDataRequest
} from '@libs/services/validators-service';
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
  stakeType: AuctionManagerEntryPoint,
  stakeAmountMotes?: string
) => {
  const [state, setState] = useState<StakeTexts>({
    ...stakeActionsTextMap[stakeType],
    amountStepMaxAmountValue: null
  });

  useEffect(() => {
    const formattedAmountCSPR =
      stakeAmountMotes &&
      formatNumber(motesToCSPR(stakeAmountMotes), { precision: { max: 4 } });

    setState({
      ...stakeActionsTextMap[stakeType],
      amountStepMaxAmountValue:
        stakeType !== AuctionManagerEntryPoint.delegate
          ? `${formattedAmountCSPR} CSPR`
          : null
    });
  }, [stakeAmountMotes, stakeType]);

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
  const [validatorList, setValidatorList] = useState<
    ValidatorResultWithId[] | null
  >(null);
  const [undelegateValidatorList, setUndelegateValidatorList] = useState<
    ValidatorResultWithId[] | null
  >(null);
  const [loading, setLoading] = useState(true);

  const { pathname } = useTypedLocation();

  const activeAccount = useSelector(selectVaultActiveAccount);
  const { casperClarityApiUrl } = useSelector(
    selectApiConfigBasedOnActiveNetwork
  );

  useEffect(() => {
    // checking pathname to know what type of stake it is
    if (pathname.split('/')[1] === AuctionManagerEntryPoint.delegate) {
      setStakeType(AuctionManagerEntryPoint.delegate);

      dispatchFetchAuctionValidatorsRequest()
        .then(({ payload }) => {
          if ('data' in payload) {
            const { data } = payload;

            const validatorListWithId = data.map(validator => ({
              ...validator,
              id: validator.public_key
            }));

            setValidatorList(validatorListWithId);
          }
        })
        .finally(() => {
          setLoading(false);
        });
    } else if (pathname.split('/')[1] === AuctionManagerEntryPoint.undelegate) {
      setStakeType(AuctionManagerEntryPoint.undelegate);

      if (activeAccount) {
        dispatchFetchValidatorsDetailsDataRequest(activeAccount.publicKey)
          .then(({ payload }) => {
            if ('data' in payload) {
              const { data } = payload;

              const validatorListWithId = data.map(delegator => ({
                ...delegator.validator,
                id: delegator.validator_public_key,
                user_stake: delegator.stake
              }));

              setUndelegateValidatorList(validatorListWithId);
            }
          })
          .finally(() => {
            setLoading(false);
          });
      }
    } else if (pathname.split('/')[1] === AuctionManagerEntryPoint.redelegate) {
      setStakeType(AuctionManagerEntryPoint.redelegate);

      if (activeAccount) {
        Promise.all([
          dispatchFetchAuctionValidatorsRequest(),
          dispatchFetchValidatorsDetailsDataRequest(activeAccount.publicKey)
        ])
          .then(([allValidatorsResp, undelegateValidatorResp]) => {
            if ('data' in allValidatorsResp.payload) {
              const { data } = allValidatorsResp.payload;

              const validatorListWithId = data.map(validator => ({
                ...validator,
                id: validator.public_key
              }));

              setValidatorList(validatorListWithId);
            }
            if ('data' in undelegateValidatorResp.payload) {
              const { data } = undelegateValidatorResp.payload;

              const validatorListWithId = data.map(delegator => ({
                ...delegator.validator,
                id: delegator.validator_public_key,
                user_stake: delegator.stake
              }));

              setUndelegateValidatorList(validatorListWithId);
            }
          })
          .finally(() => {
            setLoading(false);
          });
      }
    }
  }, [activeAccount, pathname, casperClarityApiUrl]);

  return {
    stakeType,
    validatorList,
    undelegateValidatorList,
    loading
  };
};
