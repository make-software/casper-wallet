import React, { useEffect, useState } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Trans, useTranslation } from 'react-i18next';

import {
  ContentContainer,
  ParagraphContainer,
  SpacingSize
} from '@libs/layout';
import { Typography } from '@libs/ui/components';
import { RecipientTabs } from '@libs/ui/components/recipient-tabs/recipient-tabs';
import { calculateSubmitButtonDisabled } from '@libs/ui/forms/get-submit-button-state-from-validation';
import { TransferNftRecipientFormValues } from '@libs/ui/forms/transfer-nft';

interface RecipientStepProps {
  recipientForm: UseFormReturn<TransferNftRecipientFormValues>;
  setRecipientName: React.Dispatch<React.SetStateAction<string>>;
  recipientName: string;
  setIsRecipientFormButtonDisabled: React.Dispatch<
    React.SetStateAction<boolean>
  >;
  haveReverseOwnerLookUp: boolean;
}

export const RecipientStep = ({
  recipientForm,
  setRecipientName,
  recipientName,
  setIsRecipientFormButtonDisabled,
  haveReverseOwnerLookUp
}: RecipientStepProps) => {
  const [showSelectedRecipient, setShowSelectedRecipient] = useState(false);

  const { t } = useTranslation();

  useEffect(() => {
    const isRecipientFormButtonDisabled = calculateSubmitButtonDisabled({
      isValid: showSelectedRecipient && !haveReverseOwnerLookUp
    });

    setIsRecipientFormButtonDisabled(!!isRecipientFormButtonDisabled);
  }, [
    showSelectedRecipient,
    setIsRecipientFormButtonDisabled,
    haveReverseOwnerLookUp
  ]);

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
        setShowSelectedRecipient={setShowSelectedRecipient}
        showSelectedRecipient={showSelectedRecipient}
      />
    </ContentContainer>
  );
};
