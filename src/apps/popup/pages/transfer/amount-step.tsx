import React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { UseFormReturn, useWatch } from 'react-hook-form';
import { useSelector } from 'react-redux';

import {
  ContentContainer,
  ParagraphContainer,
  SpacingSize,
  TransferInputContainer
} from '@libs/layout';
import { Input, Typography } from '@libs/ui';
import { formatFiatAmount } from '@libs/ui/utils/formatters';
import { TransferFormValues } from '@libs/ui/forms/transfer';
import { selectAccountCurrencyRate } from '@background/redux/account-info/selectors';

interface AmountStepProps {
  amountForm: UseFormReturn<TransferFormValues>;
}

export const AmountStep = ({ amountForm }: AmountStepProps) => {
  const { t } = useTranslation();

  const currencyRate = useSelector(selectAccountCurrencyRate);

  const {
    register,
    formState: { errors },
    control
  } = amountForm;

  const amount = useWatch({
    control,
    name: 'amount'
  });

  const amountLabel = t('Amount');
  const transferIdLabel = t('Transfer ID (memo)');

  const fiatAmount = formatFiatAmount(amount || '0', currencyRate);

  return (
    <ContentContainer>
      <ParagraphContainer top={SpacingSize.XL}>
        <Typography type="header">
          <Trans t={t}>Enter amount</Trans>
        </Typography>
      </ParagraphContainer>

      <TransferInputContainer>
        <Input
          label={amountLabel}
          rightLabel={fiatAmount}
          type="number"
          monotype
          placeholder={t('0.00')}
          suffixText="CSPR"
          {...register('amount')}
          error={!!errors?.amount}
          validationText={errors?.amount?.message}
        />
      </TransferInputContainer>

      <TransferInputContainer>
        <Input
          label={transferIdLabel}
          type="number"
          monotype
          placeholder={t('Enter numeric value')}
          {...register('transferIdMemo')}
          error={!!errors?.transferIdMemo}
          validationText={errors?.transferIdMemo?.message}
        />
      </TransferInputContainer>
    </ContentContainer>
  );
};
