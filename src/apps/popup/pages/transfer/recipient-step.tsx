import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Trans, useTranslation } from 'react-i18next';

import {
  ContentContainer,
  ParagraphContainer,
  SpacingSize
} from '@libs/layout';
import {
  ActiveAccountPlate,
  RecipientDropdownInput,
  Typography
} from '@libs/ui';
import { TransferRecipientFormValues } from '@libs/ui/forms/transfer';

interface RecipientStepProps {
  recipientForm: UseFormReturn<TransferRecipientFormValues>;
  balance: string | null;
  symbol: string | null;
  setRecipientName: React.Dispatch<React.SetStateAction<string>>;
  recipientName: string;
}

export const RecipientStep = ({
  recipientForm,
  balance,
  symbol,
  setRecipientName,
  recipientName
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

      <RecipientDropdownInput
        recipientForm={recipientForm}
        setRecipientName={setRecipientName}
        recipientName={recipientName}
      />
    </ContentContainer>
  );
};
