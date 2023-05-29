import React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { FormState, UseFormRegister } from 'react-hook-form';

import {
  ContentContainer,
  ParagraphContainer,
  SpacingSize,
  TransferInputContainer
} from '@libs/layout';
import { Input, Typography } from '@libs/ui';
import { formatCurrency } from '@libs/ui/utils/formatters';
import { useActiveAccountBalance } from '@hooks/use-active-account-balance';
import { TransferFormValues } from '@libs/ui/forms/transfer';

interface AmountStepProps {
  amountFormRegister: UseFormRegister<TransferFormValues>;
  amountFormState: FormState<TransferFormValues>;
}

export const AmountStep = ({
  amountFormRegister,
  amountFormState
}: AmountStepProps) => {
  const { t } = useTranslation();

  const { currencyRate } = useActiveAccountBalance();

  const amountLabel = t('Amount');
  const transferIdLabel = t('Transfer ID (memo)');

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
          rightLabel={formatCurrency(currencyRate || 0, 'USD', {
            precision: 4
          })}
          type="number"
          monotype
          placeholder={t('0.00')}
          suffixText="CSPR"
          {...amountFormRegister('csprAmount')}
          error={!!amountFormState.errors?.csprAmount}
          validationText={amountFormState.errors?.csprAmount?.message}
        />
      </TransferInputContainer>

      <TransferInputContainer>
        <Input
          label={transferIdLabel}
          monotype
          placeholder={t('Enter numeric value')}
          {...amountFormRegister('transferIdMemo')}
          error={!!amountFormState.errors?.transferIdMemo}
          validationText={amountFormState.errors?.transferIdMemo?.message}
        />
      </TransferInputContainer>
    </ContentContainer>
  );
};
