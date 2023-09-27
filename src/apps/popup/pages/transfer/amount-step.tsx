import React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { UseFormReturn, useWatch } from 'react-hook-form';
import { useSelector } from 'react-redux';

import {
  ContentContainer,
  ParagraphContainer,
  SpacingSize,
  VerticalSpaceContainer
} from '@libs/layout';
import { Input, Typography } from '@libs/ui';
import { formatFiatAmount } from '@libs/ui/utils/formatters';
import { TransferAmountFormValues } from '@libs/ui/forms/transfer';
import { selectAccountCurrencyRate } from '@background/redux/account-info/selectors';

interface AmountStepProps {
  amountForm: UseFormReturn<TransferAmountFormValues>;
  symbol: string | null;
  isCSPR: boolean;
}

export const AmountStep = ({ amountForm, symbol, isCSPR }: AmountStepProps) => {
  const { t } = useTranslation();

  const currencyRate = useSelector(selectAccountCurrencyRate);

  const {
    register,
    formState: { errors },
    control
  } = amountForm;

  const { onChange: onChangeTransferIdMemo } = register('transferIdMemo');
  const { onChange: onChangeCSPRAmount } = register('amount');

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

      <VerticalSpaceContainer top={SpacingSize.XXL}>
        <Input
          label={amountLabel}
          rightLabel={fiatAmount}
          monotype
          placeholder={t('0.00')}
          suffixText={symbol}
          {...register('amount')}
          onChange={e => {
            // replace all non-numeric characters except decimal point
            e.target.value = e.target.value.replace(/[^0-9.]/g, '');
            // regex replace decimal point from beginning of string
            e.target.value = e.target.value.replace(/^\./, '');
            onChangeCSPRAmount(e);
          }}
          error={!!errors?.amount}
          validationText={errors?.amount?.message}
        />
      </VerticalSpaceContainer>

      {/** transferIdMemo is only relevant for CSPR */}
      <VerticalSpaceContainer top={SpacingSize.XL}>
        {isCSPR ? (
          <Input
            label={transferIdLabel}
            monotype
            placeholder={t('Enter numeric value')}
            {...register('transferIdMemo')}
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
