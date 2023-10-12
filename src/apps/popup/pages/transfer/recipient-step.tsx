import React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { UseFormReturn } from 'react-hook-form';

import {
  ContentContainer,
  ParagraphContainer,
  SpacingSize
} from '@libs/layout';
import {
  Typography,
  ActiveAccountPlate,
  RecipientDropdownInput
} from '@libs/ui';
import { TransferRecipientFormValues } from '@libs/ui/forms/transfer';

interface RecipientStepProps {
  recipientForm: UseFormReturn<TransferRecipientFormValues>;
  balance: string | null;
  symbol: string | null;
}

export const RecipientStep = ({
  recipientForm,
  balance,
  symbol
}: RecipientStepProps) => {
  const { t } = useTranslation();

  return (
    <ContentContainer>
      <ParagraphContainer top={SpacingSize.XL}>
        <Typography type="header">
          <Trans t={t}>Specify recipient</Trans>
        </Typography>
      </ParagraphContainer>
      <ActiveAccountPlate label="From" balance={balance} symbol={symbol} />

      <RecipientDropdownInput recipientForm={recipientForm} />
    </ContentContainer>
  );
};
