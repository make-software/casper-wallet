import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Trans, useTranslation } from 'react-i18next';

import {
  ContentContainer,
  ParagraphContainer,
  SpacingSize
} from '@libs/layout';
import { Typography } from '@libs/ui/components';
import { RecipientTabs } from '@libs/ui/components/recipient-tabs/recipient-tabs';
import { TransferNftRecipientFormValues } from '@libs/ui/forms/transfer-nft';

interface RecipientStepProps {
  recipientForm: UseFormReturn<TransferNftRecipientFormValues>;
  setRecipientName: React.Dispatch<React.SetStateAction<string>>;
  recipientName: string;
}

export const RecipientStep = ({
  recipientForm,
  setRecipientName,
  recipientName
}: RecipientStepProps) => {
  const { t } = useTranslation();

  return (
    <ContentContainer>
      <ParagraphContainer top={SpacingSize.XL}>
        <Typography type="header">
          <Trans t={t}>Select recipient</Trans>
        </Typography>
      </ParagraphContainer>

      <RecipientTabs
        recipientForm={recipientForm}
        recipientName={recipientName}
        setRecipientName={setRecipientName}
      />
    </ContentContainer>
  );
};
