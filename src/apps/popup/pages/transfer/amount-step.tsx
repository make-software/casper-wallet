import React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { Control, FormState, UseFormRegister, useWatch } from 'react-hook-form';

import {
  ContentContainer,
  ParagraphContainer,
  SpacingSize,
  TransferInputContainer
} from '@libs/layout';
import { Input, Typography } from '@libs/ui';
import { formatFiatAmount } from '@libs/ui/utils/formatters';
import { useActiveAccountBalance } from '@hooks/use-active-account-balance';
import { TransferFormValues } from '@libs/ui/forms/transfer';

interface AmountStepProps {
  amountFormRegister: UseFormRegister<TransferFormValues>;
  amountFormState: FormState<TransferFormValues>;
  controlAmountForm: Control<TransferFormValues>;
}

export const AmountStep = ({
  amountFormRegister,
  amountFormState,
  controlAmountForm
}: AmountStepProps) => {
  const { t } = useTranslation();

  const { currencyRate } = useActiveAccountBalance();
  const csprAmount = useWatch({
    control: controlAmountForm,
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
          type="number"
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
