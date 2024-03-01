import Big from 'big.js';
import React, { useEffect, useState } from 'react';
import { UseFormReturn, useWatch } from 'react-hook-form';
import { Trans, useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';

import { TRANSFER_COST_MOTES, TRANSFER_MIN_AMOUNT_MOTES } from '@src/constants';

import {
  selectAccountBalance,
  selectAccountCurrencyRate
} from '@background/redux/account-info/selectors';

import {
  ContentContainer,
  ParagraphContainer,
  SpacingSize,
  VerticalSpaceContainer
} from '@libs/layout';
import { Checkbox, Input, Typography } from '@libs/ui/components';
import { TransferAmountFormValues } from '@libs/ui/forms/transfer';
import { formatFiatAmount, motesToCSPR } from '@libs/ui/utils';

interface AmountStepProps {
  amountForm: UseFormReturn<TransferAmountFormValues>;
  symbol: string | null;
  isCSPR: boolean;
}

export const AmountStep = ({ amountForm, symbol, isCSPR }: AmountStepProps) => {
  const [isChecked, setIsChecked] = useState(false);
  const [disabled, setDisabled] = useState(false);
  const [maxAmountMotes, setMaxAmountMotes] = useState('0');

  const { t } = useTranslation();

  const currencyRate = useSelector(selectAccountCurrencyRate);
  const csprBalance = useSelector(selectAccountBalance);

  useEffect(() => {
    const maxAmountMotes: string =
      csprBalance.liquidMotes == null
        ? '0'
        : Big(csprBalance.liquidMotes).sub(TRANSFER_COST_MOTES).toFixed();

    const hasEnoughBalance = Big(maxAmountMotes).gte(TRANSFER_MIN_AMOUNT_MOTES);
    const isMaxAmountEqualMinAmount = Big(maxAmountMotes).eq(
      TRANSFER_MIN_AMOUNT_MOTES
    );

    setIsChecked(isMaxAmountEqualMinAmount);
    setMaxAmountMotes(maxAmountMotes);
    setDisabled(!hasEnoughBalance);
  }, [csprBalance.liquidMotes]);

  const {
    register,
    formState: { errors },
    control,
    setValue,
    trigger
  } = amountForm;

  const { onChange: onChangeTransferIdMemo } = register('transferIdMemo');
  const { onChange: onChangeCSPRAmount } = register('amount');
  const { onChange: onChangePaymentAmount } = register('paymentAmount');

  const amount = useWatch({
    control,
    name: 'amount'
  });

  const paymentAmount = useWatch({
    control,
    name: 'paymentAmount'
  });

  const amountLabel = t('Amount');
  const transferIdLabel = t('Transfer ID (memo)');
  const paymentAmoutLabel = t('Set custom transaction fee');
  const fiatAmount = isCSPR
    ? formatFiatAmount(amount || '0', currencyRate)
    : undefined;
  const paymentFiatAmount = !isCSPR
    ? formatFiatAmount(paymentAmount || '0', currencyRate)
    : undefined;

  return (
    <ContentContainer>
      <ParagraphContainer top={SpacingSize.XL}>
        <Typography type="header">
          <Trans t={t}>Enter amount</Trans>
        </Typography>
      </ParagraphContainer>

      {isCSPR && disabled && (
        <ParagraphContainer top={SpacingSize.Small}>
          <Typography type="body" color="contentActionCritical">
            <Trans t={t}>
              You don't have enough CSPR to cover the transfer minimum amount
              and the transaction fee.
            </Trans>
          </Typography>
        </ParagraphContainer>
      )}

      <VerticalSpaceContainer top={SpacingSize.XXL}>
        <Input
          label={amountLabel}
          rightLabel={fiatAmount}
          monotype
          placeholder={t('0.00')}
          suffixText={symbol}
          {...register('amount')}
          disabled={isCSPR && disabled}
          onChange={e => {
            // replace all non-numeric characters except decimal point
            e.target.value = e.target.value.replace(/[^0-9.]/g, '');
            // regex replace decimal point from beginning of string
            e.target.value = e.target.value.replace(/^\./, '');
            onChangeCSPRAmount(e);

            if (isChecked) {
              setIsChecked(false);
            }
          }}
          error={!!errors?.amount}
          validationText={errors?.amount?.message}
        />
      </VerticalSpaceContainer>

      {isCSPR && (
        <VerticalSpaceContainer top={SpacingSize.Small}>
          <Checkbox
            variant="square"
            label={t('Send max amount')}
            checked={isChecked}
            disabled={disabled}
            onChange={() => {
              if (isChecked) {
                setValue('amount', motesToCSPR(TRANSFER_MIN_AMOUNT_MOTES));
              } else {
                setValue('amount', motesToCSPR(maxAmountMotes));
              }
              trigger('amount');
              setIsChecked(!isChecked);
            }}
          />
        </VerticalSpaceContainer>
      )}

      {/** transferIdMemo is only relevant for CSPR */}
      <VerticalSpaceContainer top={SpacingSize.XL}>
        {isCSPR ? (
          <Input
            label={transferIdLabel}
            monotype
            placeholder={t('Enter numeric value')}
            {...register('transferIdMemo')}
            disabled={disabled}
            onChange={e => {
              // replace all non-numeric characters
              e.target.value = e.target.value.replace(/[^0-9]/g, '');
              onChangeTransferIdMemo(e);
            }}
            error={!!errors?.transferIdMemo}
            validationText={errors?.transferIdMemo?.message}
          />
        ) : (
          <Input
            label={paymentAmoutLabel}
            rightLabel={paymentFiatAmount}
            monotype
            placeholder={t('Enter transaction fee')}
            suffixText={'CSPR'}
            {...register('paymentAmount')}
            onChange={e => {
              // replace all non-numeric characters except decimal point
              e.target.value = e.target.value.replace(/[^0-9.]/g, '');
              // regex replace decimal point from beginning of string
              e.target.value = e.target.value.replace(/^\./, '');

              onChangePaymentAmount(e);
            }}
            error={!!errors?.paymentAmount}
            validationText={
              errors?.paymentAmount?.message ||
              "You'll be charged this amount in CSPR as a transaction fee. You can change it at your discretion."
            }
          />
        )}
      </VerticalSpaceContainer>
    </ContentContainer>
  );
};
