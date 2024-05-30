import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Trans, useTranslation } from 'react-i18next';

import { AuctionManagerEntryPoint, StakeSteps } from '@src/constants';

import { AmountStep } from '@popup/pages/stakes/amount-step';
import { ConfirmStep } from '@popup/pages/stakes/confirm-step';
import { RedelegateValidatorDropdownInput } from '@popup/pages/stakes/redelegate-validator-dropdown-input';
import { Step } from '@popup/pages/stakes/step';
import { useStakeActionTexts } from '@popup/pages/stakes/utils';
import { ValidatorDropdownInput } from '@popup/pages/stakes/validator-dropdown-input';

import {
  AlignedFlexRow,
  ParagraphContainer,
  SpacingSize,
  VerticalSpaceContainer
} from '@libs/layout';
import { ILedgerEvent } from '@libs/services/ledger';
import { ValidatorResultWithId } from '@libs/services/validators-service/types';
import {
  LedgerEventView,
  TransferSuccessScreen,
  Typography
} from '@libs/ui/components';
import {
  StakeAmountFormValues,
  StakeNewValidatorFormValues,
  StakeValidatorFormValues
} from '@libs/ui/forms/stakes-form';

interface DelegateStakePageContentProps {
  stakeStep: StakeSteps;
  validatorForm: UseFormReturn<StakeValidatorFormValues>;
  amountForm: UseFormReturn<StakeAmountFormValues>;
  newValidatorForm: UseFormReturn<StakeNewValidatorFormValues>;
  inputAmountCSPR: string;
  validator: ValidatorResultWithId | null;
  setValidator: React.Dispatch<
    React.SetStateAction<ValidatorResultWithId | null>
  >;
  newValidator: ValidatorResultWithId | null;
  setNewValidator: React.Dispatch<
    React.SetStateAction<ValidatorResultWithId | null>
  >;
  stakesType: AuctionManagerEntryPoint;
  stakeAmountMotes: string;
  setStakeAmount: React.Dispatch<React.SetStateAction<string>>;
  validatorList: ValidatorResultWithId[] | null;
  undelegateValidatorList: ValidatorResultWithId[] | null;
  loading: boolean;
  LedgerEventStatus: ILedgerEvent;
}

export const StakesPageContent = ({
  stakeStep,
  validatorForm,
  amountForm,
  newValidatorForm,
  inputAmountCSPR,
  validator,
  setValidator,
  newValidator,
  setNewValidator,
  stakesType,
  stakeAmountMotes,
  setStakeAmount,
  validatorList,
  undelegateValidatorList,
  loading,
  LedgerEventStatus
}: DelegateStakePageContentProps) => {
  const { t } = useTranslation();

  const {
    validatorStepHeaderText,
    newValidatorStepHeaderText,
    amountStepHeaderText,
    confirmStepHeaderText,
    successStepHeaderText,
    confirmStepText,
    amountStepText,
    amountStepMaxAmountValue
  } = useStakeActionTexts(stakesType, stakeAmountMotes);

  const getContent = {
    [StakeSteps.Validator]: (
      <Step headerText={validatorStepHeaderText}>
        <ValidatorDropdownInput
          validatorForm={validatorForm}
          validatorList={validatorList}
          undelegateValidatorList={undelegateValidatorList}
          validator={validator}
          setValidator={setValidator}
          setStakeAmount={setStakeAmount}
          stakesType={stakesType}
          loading={loading}
        />
      </Step>
    ),
    [StakeSteps.Amount]: (
      <Step headerText={amountStepHeaderText}>
        <AmountStep
          amountForm={amountForm}
          stakesType={stakesType}
          stakeAmountMotes={stakeAmountMotes}
          amountStepText={amountStepText}
          amountStepMaxAmountValue={amountStepMaxAmountValue}
        />
      </Step>
    ),
    [StakeSteps.NewValidator]: (
      <Step headerText={newValidatorStepHeaderText!}>
        <ParagraphContainer top={SpacingSize.Medium}>
          <AlignedFlexRow gap={SpacingSize.Small}>
            <Typography type="body" color="contentSecondary">
              <Trans t={t}>Amount:</Trans>
            </Typography>
            <Typography type="bodyHash">{`${inputAmountCSPR} CSPR`}</Typography>
          </AlignedFlexRow>
        </ParagraphContainer>
        <RedelegateValidatorDropdownInput
          newValidatorForm={newValidatorForm}
          validatorList={validatorList}
          validator={newValidator}
          setValidator={setNewValidator}
          setStakeAmount={setStakeAmount}
        />
      </Step>
    ),
    [StakeSteps.Confirm]: (
      <Step headerText={confirmStepHeaderText}>
        <ConfirmStep
          newValidator={newValidator}
          validator={validator}
          inputAmountCSPR={inputAmountCSPR}
          stakesType={stakesType}
          confirmStepText={confirmStepText}
        />
      </Step>
    ),
    [StakeSteps.ConfirmWithLedger]: (
      <LedgerEventView event={LedgerEventStatus} />
    ),
    [StakeSteps.Success]: (
      <TransferSuccessScreen headerText={successStepHeaderText}>
        {stakesType === AuctionManagerEntryPoint.redelegate ? (
          <VerticalSpaceContainer top={SpacingSize.Medium}>
            <Typography type="body" color="contentSecondary">
              <Trans t={t}>
                I usually takes around{' '}
                <Typography type="bodySemiBold">14 to 16 hours</Typography> for
                this operation to complete.
              </Trans>
            </Typography>
          </VerticalSpaceContainer>
        ) : null}
      </TransferSuccessScreen>
    )
  };

  return getContent[stakeStep];
};
