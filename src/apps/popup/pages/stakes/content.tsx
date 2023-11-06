import React, { useEffect, useState } from 'react';
import { UseFormReturn } from 'react-hook-form';

import { ValidatorStep } from '@popup/pages/stakes/validator-step';
import { AmountStep } from '@popup/pages/stakes/amount-step';
import {
  StakeAmountFormValues,
  StakeValidatorFormValues
} from '@libs/ui/forms/stakes-form';
import { ConfirmStep } from '@popup/pages/stakes/confirm-step';
import { TransferSuccessScreen, ValidatorDropdownInput } from '@libs/ui';
import { StakeSteps } from '@src/constants';
import { ValidatorResultWithId } from '@libs/services/validators-service/types';
import { AuctionManagerEntryPoint } from '@libs/services/deployer-service';
import { formatNumber, motesToCSPR } from '@libs/ui/utils/formatters';

interface DelegateStakePageContentProps {
  stakeStep: StakeSteps;
  validatorForm: UseFormReturn<StakeValidatorFormValues>;
  amountForm: UseFormReturn<StakeAmountFormValues>;
  inputAmountCSPR: string;
  validator: ValidatorResultWithId | null;
  setValidator: React.Dispatch<
    React.SetStateAction<ValidatorResultWithId | null>
  >;
  stakesType: AuctionManagerEntryPoint;
  stakeAmountMotes: string;
  setStakeAmount: React.Dispatch<React.SetStateAction<string>>;
  validatorList: ValidatorResultWithId[] | null;
}

export const StakesPageContent = ({
  stakeStep,
  validatorForm,
  amountForm,
  inputAmountCSPR,
  validator,
  setValidator,
  stakesType,
  stakeAmountMotes,
  setStakeAmount,
  validatorList
}: DelegateStakePageContentProps) => {
  const [validateStepHeaderText, setValidateStepHeaderText] = useState('');
  const [amountStepHeaderText, setAmountStepHeaderText] = useState('');
  const [confirmStepHeaderText, setConfirmStepHeaderText] = useState('');
  const [successStepHeaderText, setSuccessStepHeaderText] = useState('');
  const [confirmStepText, setConfirmStepText] = useState('');
  const [amountStepText, setAmountStepText] = useState('');
  const [amountStepMaxButtonText, setAmountStepMaxButtonText] = useState('');

  useEffect(() => {
    const formattedAmountCSPR =
      stakeAmountMotes && formatNumber(motesToCSPR(stakeAmountMotes));

    switch (stakesType) {
      case AuctionManagerEntryPoint.delegate: {
        setValidateStepHeaderText('Delegate');
        setAmountStepHeaderText('Delegate amount');
        setConfirmStepHeaderText('Confirm delegation');
        setSuccessStepHeaderText('You’ve submitted a delegation');

        setAmountStepText('Delegate:');
        setAmountStepMaxButtonText('Max');
        setConfirmStepText('You’ll delegate');
        break;
      }
      case AuctionManagerEntryPoint.undelegate: {
        setValidateStepHeaderText('Undelegate');
        setAmountStepHeaderText('Undelegate amount');
        setConfirmStepHeaderText('Confirm undelegation');
        setSuccessStepHeaderText('You’ve submitted an undelegation');

        setAmountStepText('Undelegate max:');
        setAmountStepMaxButtonText(`${formattedAmountCSPR} CSPR`);
        setConfirmStepText('You’ll undelegate');
        break;
      }

      default:
        throw Error('fetch validator: unknown stakes type');
    }
  }, [stakeAmountMotes, stakesType]);

  switch (stakeStep) {
    case StakeSteps.Validator: {
      return (
        <ValidatorStep headerText={validateStepHeaderText}>
          <ValidatorDropdownInput
            validatorForm={validatorForm}
            validatorList={validatorList}
            validator={validator}
            setValidator={setValidator}
            setStakeAmount={setStakeAmount}
            stakesType={stakesType}
          />
        </ValidatorStep>
      );
    }
    case StakeSteps.Amount: {
      return (
        <AmountStep
          amountForm={amountForm}
          stakesType={stakesType}
          stakeAmountMotes={stakeAmountMotes}
          headerText={amountStepHeaderText}
          amountStepText={amountStepText}
          amountStepMaxButtonText={amountStepMaxButtonText}
        />
      );
    }
    case StakeSteps.Confirm: {
      return (
        <ConfirmStep
          validator={validator}
          inputAmountCSPR={inputAmountCSPR}
          stakesType={stakesType}
          headerText={confirmStepHeaderText}
          confirmStepText={confirmStepText}
        />
      );
    }
    case StakeSteps.Success: {
      return <TransferSuccessScreen headerText={successStepHeaderText} />;
    }
    default: {
      throw Error('Out of bound: StakeSteps');
    }
  }
};
