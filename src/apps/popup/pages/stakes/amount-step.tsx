import React, { useEffect, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { UseFormReturn, useWatch } from 'react-hook-form';
import { useSelector } from 'react-redux';
import Big from 'big.js';
import styled from 'styled-components';

import {
  AlignedFlexRow,
  ContentContainer,
  ParagraphContainer,
  SpacingSize,
  VerticalSpaceContainer
} from '@libs/layout';
import { Error, Input, Typography } from '@libs/ui';
import { StakeAmountFormValues } from '@libs/ui/forms/stakes-form';
import { formatFiatAmount, motesToCSPR } from '@libs/ui/utils/formatters';
import {
  selectAccountBalance,
  selectAccountCurrencyRate
} from '@background/redux/account-info/selectors';
import { STAKE_COST_MOTES } from '@src/constants';
import { AuctionManagerEntryPoint } from '@libs/services/deployer-service';

const StakeMaxButton = styled.div`
  background: ${({ theme }) => theme.color.backgroundPrimary};
  border-radius: ${({ theme }) => theme.borderRadius.base}px;

  padding: 4px 12px;

  cursor: pointer;
`;

interface AmountStepProps {
  amountForm: UseFormReturn<StakeAmountFormValues>;
  stakesType: AuctionManagerEntryPoint;
  stakeAmountMotes: string;
  headerText: string;
  amountStepText: string;
  amountStepMaxButtonText: string;
}

export const AmountStep = ({
  amountForm,
  stakesType,
  stakeAmountMotes,
  headerText,
  amountStepText,
  amountStepMaxButtonText
}: AmountStepProps) => {
  const [maxAmountMotes, setMaxAmountMotes] = useState('0');

  const { t } = useTranslation();

  const currencyRate = useSelector(selectAccountCurrencyRate);
  const csprBalance = useSelector(selectAccountBalance);

  useEffect(() => {
    switch (stakesType) {
      case AuctionManagerEntryPoint.delegate: {
        const maxAmountMotes: string =
          csprBalance.amountMotes == null
            ? '0'
            : Big(csprBalance.amountMotes).sub(STAKE_COST_MOTES).toString();

        setMaxAmountMotes(maxAmountMotes);
        break;
      }
      case AuctionManagerEntryPoint.undelegate: {
        setMaxAmountMotes(stakeAmountMotes);
      }
    }
  }, [csprBalance.amountMotes, stakeAmountMotes, stakesType]);

  const {
    register,
    formState: { errors },
    control,
    setValue,
    trigger
  } = amountForm;

  const { onChange: onChangeCSPRAmount } = register('amount');

  const amount = useWatch({
    control,
    name: 'amount'
  });

  const amountLabel = t('Amount');

  const fiatAmount = formatFiatAmount(amount || '0', currencyRate);

  return (
    <ContentContainer>
      <ParagraphContainer top={SpacingSize.XL}>
        <Typography type="header">
          <Trans t={t}>{headerText}</Trans>
        </Typography>
      </ParagraphContainer>

      <VerticalSpaceContainer top={SpacingSize.XXL}>
        <Input
          label={amountLabel}
          rightLabel={fiatAmount}
          monotype
          placeholder={t('0.00')}
          suffixText={'CSPR'}
          {...register('amount')}
          onChange={e => {
            // replace all non-numeric characters except decimal point
            e.target.value = e.target.value.replace(/[^0-9.]/g, '');
            // regex replace decimal point from beginning of string
            e.target.value = e.target.value.replace(/^\./, '');
            onChangeCSPRAmount(e);
          }}
        />
      </VerticalSpaceContainer>
      <ParagraphContainer top={SpacingSize.Small}>
        <AlignedFlexRow gap={SpacingSize.Small}>
          <Typography type="captionRegular" color="contentSecondary">
            <Trans t={t}>{amountStepText}</Trans>
          </Typography>
          <StakeMaxButton
            onClick={() => {
              setValue('amount', motesToCSPR(maxAmountMotes));
              trigger('amount');
            }}
          >
            <Typography type="captionHash" color="contentAction">
              {amountStepMaxButtonText}
            </Typography>
          </StakeMaxButton>
        </AlignedFlexRow>
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
    </ContentContainer>
  );
};
