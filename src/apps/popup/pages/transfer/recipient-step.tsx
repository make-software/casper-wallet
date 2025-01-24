import React, { useEffect, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';

import {
  ContentContainer,
  ParagraphContainer,
  SpacingSize
} from '@libs/layout';
import { Typography } from '@libs/ui/components';
import { RecipientTabs } from '@libs/ui/components/recipient-tabs/recipient-tabs';
import { calculateSubmitButtonDisabled } from '@libs/ui/forms/get-submit-button-state-from-validation';
import { useTransferRecipientForm } from '@libs/ui/forms/transfer';

interface RecipientStepProps {
  setRecipientName: React.Dispatch<React.SetStateAction<string>>;
  recipientName: string;
  setRecipientPublicKey: (value: React.SetStateAction<string>) => void;
  setIsRecipientFormButtonDisabled: React.Dispatch<
    React.SetStateAction<boolean>
  >;
}

export const RecipientStep = ({
  setRecipientName,
  recipientName,
  setIsRecipientFormButtonDisabled,
  setRecipientPublicKey
}: RecipientStepProps) => {
  const [showSelectedRecipient, setShowSelectedRecipient] = useState(false);

  const { t } = useTranslation();

  const recipientForm = useTransferRecipientForm();

  useEffect(() => {
    const isRecipientFormButtonDisabled = calculateSubmitButtonDisabled({
      isValid: showSelectedRecipient
    });

    setIsRecipientFormButtonDisabled(!!isRecipientFormButtonDisabled);
  }, [showSelectedRecipient, setIsRecipientFormButtonDisabled]);

  return (
    <ContentContainer>
      <ParagraphContainer top={SpacingSize.XL}>
        <Typography type="header">
          <Trans t={t}>Specify recipient</Trans>
        </Typography>
      </ParagraphContainer>

      <RecipientTabs
        recipientForm={recipientForm}
        recipientName={recipientName}
        setRecipientName={setRecipientName}
        setRecipientPublicKey={setRecipientPublicKey}
        setShowSelectedRecipient={setShowSelectedRecipient}
        showSelectedRecipient={showSelectedRecipient}
      />
    </ContentContainer>
  );
};
