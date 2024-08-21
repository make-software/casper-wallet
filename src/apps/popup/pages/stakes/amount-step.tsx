import Big from 'big.js';
import React, { useEffect, useState } from 'react';
import { UseFormReturn, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import {
  AuctionManagerEntryPoint,
  DELEGATION_MIN_AMOUNT_MOTES,
  STAKE_COST_MOTES
} from '@src/constants';

import {
  selectAccountBalance,
  selectAccountCurrencyRate
} from '@background/redux/account-info/selectors';

import {
  AlignedFlexRow,
  ParagraphContainer,
  SpacingSize,
  VerticalSpaceContainer
} from '@libs/layout';
import { Error, Input, Typography } from '@libs/ui/components';
import { StakeAmountFormValues } from '@libs/ui/forms/stakes-form';
import {
  formatFiatAmount,
  handleNumericInput,
  motesToCSPR
} from '@libs/ui/utils';

const StakeMaxButton = styled(AlignedFlexRow)<{ disabled?: boolean }>`
  cursor: ${({ disabled }) => (disabled ? 'default' : 'pointer')};
`;

interface AmountStepProps {
  amountForm: UseFormReturn<StakeAmountFormValues>;
  stakeType: AuctionManagerEntryPoint;
  stakeAmountMotes: string;
  amountStepText: string;
  amountStepMaxAmountValue: string | null;
}

export const AmountStep = ({
  amountForm,
  stakeType,
  stakeAmountMotes,
  amountStepText,
  amountStepMaxAmountValue
}: AmountStepProps) => {
  const [maxAmountMotes, setMaxAmountMotes] = useState('0');
  const [disabled, setDisabled] = useState(false);

  const { t } = useTranslation();

  const currencyRate = useSelector(selectAccountCurrencyRate);
  const csprBalance = useSelector(selectAccountBalance);

  useEffect(() => {
    switch (stakeType) {
      case AuctionManagerEntryPoint.delegate: {
        const maxAmountMotes: string =
          csprBalance.liquidMotes == null
            ? '0'
            : Big(csprBalance.liquidMotes).sub(STAKE_COST_MOTES).toFixed();
        const minAmount = Big(STAKE_COST_MOTES)
          .add(DELEGATION_MIN_AMOUNT_MOTES)
          .toFixed();
        const hasEnoughBalance =
          csprBalance.liquidMotes != null &&
          Big(csprBalance.liquidMotes).gte(minAmount);

        setDisabled(!hasEnoughBalance);

        setMaxAmountMotes(maxAmountMotes);
        break;
      }
      case AuctionManagerEntryPoint.undelegate:
      case AuctionManagerEntryPoint.redelegate: {
        const hasEnoughBalance =
          csprBalance.liquidMotes != null &&
          Big(csprBalance.liquidMotes).gte(STAKE_COST_MOTES);

        setDisabled(!hasEnoughBalance);
        setMaxAmountMotes(stakeAmountMotes);
      }
    }
  }, [csprBalance.liquidMotes, stakeAmountMotes, stakeType]);

  const {
    register,
    formState: { errors },
    control,
    setValue,
    trigger
  } = amountForm;

  const amount = useWatch({
    control,
    name: 'amount'
  });

  const amountLabel = t('Amount');

  const fiatAmount = formatFiatAmount(amount || '0', currencyRate);

  return (
    <>
      {disabled && (
        <VerticalSpaceContainer top={SpacingSize.XL}>
          <Error
            header="Not enough CSPR"
            description={
              stakeType === AuctionManagerEntryPoint.delegate
                ? "You don't have enough CSPR to cover the delegation minimum amount\n" +
                  '              and the transaction fee.'
                : "You don't have enough CSPR to cover the transaction fee."
            }
          />
        </VerticalSpaceContainer>
      )}
      <VerticalSpaceContainer top={SpacingSize.XXL}>
        <Input
          label={amountLabel}
          rightLabel={fiatAmount}
          type="number"
          monotype
          autoFocus
          placeholder={t('0.00')}
          suffixText={'CSPR'}
          {...register('amount')}
          onKeyDown={handleNumericInput}
          disabled={disabled}
        />
      </VerticalSpaceContainer>
      <ParagraphContainer top={SpacingSize.Small}>
        <StakeMaxButton
          disabled={disabled}
          gap={SpacingSize.Small}
          onClick={() => {
            if (disabled) return;

            setValue('amount', motesToCSPR(maxAmountMotes));
            trigger('amount');
          }}
        >
          <Typography
            type="captionRegular"
            color={disabled ? 'contentSecondary' : 'contentAction'}
          >
            {amountStepText}
          </Typography>
          {amountStepMaxAmountValue && (
            <Typography
              type="captionHash"
              color={disabled ? 'contentSecondary' : 'contentAction'}
            >
              {amountStepMaxAmountValue}
            </Typography>
          )}
        </StakeMaxButton>
      </ParagraphContainer>
      {errors.amount && (
        <VerticalSpaceContainer top={SpacingSize.XL}>
          <Error
            // @ts-ignore
            header={errors.amount.message.header}
            // @ts-ignore
            description={errors.amount.message.description}
          />
        </VerticalSpaceContainer>
      )}
    </>
  );
};
