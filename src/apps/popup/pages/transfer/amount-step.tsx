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

  const { onChange: onChangeTransferIdMemo } = register('transferIdMemo');
  const { onChange: onChangeCSPRAmount } = register('csprAmount');

  const csprAmount = useWatch({
    control,
    name: 'csprAmount'
  });

  const amountLabel = t('Amount');
  const transferIdLabel = t('Transfer ID (memo)');

  const fiatAmount = formatFiatAmount(csprAmount || '0', currencyRate);

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
          monotype
          placeholder={t('0.00')}
          suffixText="CSPR"
          {...register('csprAmount')}
          onChange={e => {
            // replace all non-numeric characters except decimal point
            e.target.value = e.target.value.replace(/[^0-9.]/g, '');
            // regex replace decimal point from beginning of string
            e.target.value = e.target.value.replace(/^\./, '');
            onChangeCSPRAmount(e);
          }}
          error={!!errors?.csprAmount}
          validationText={errors?.csprAmount?.message}
        />
      </TransferInputContainer>

      <TransferInputContainer>
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
      </TransferInputContainer>
    </ContentContainer>
  );
};
