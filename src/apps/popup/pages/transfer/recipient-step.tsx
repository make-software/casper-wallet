import React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { FormState, UseFormRegister } from 'react-hook-form';
import { useSelector } from 'react-redux';

import {
  ContentContainer,
  ParagraphContainer,
  SpacingSize,
  TransferInputContainer
} from '@libs/layout';
import { Input, Typography } from '@libs/ui';
import { SenderDetails } from '@popup/pages/transfer/sender-details';
import { TransferFormValues } from '@libs/ui/forms/transfer';
import { selectRecentRecipientPublicKeys } from '@src/background/redux/recent-recipient-public-keys/selectors';

interface RecipientStepProps {
  register: UseFormRegister<TransferFormValues>;
  formState: FormState<TransferFormValues>;
}

export const RecipientStep = ({
  register,
  formState: { errors }
}: RecipientStepProps) => {
  const { t } = useTranslation();

  const recentRecipientPublicKeys = useSelector(
    selectRecentRecipientPublicKeys
  );

  return (
    <ContentContainer>
      <ParagraphContainer top={SpacingSize.XL}>
        <Typography type="header">
          <Trans t={t}>Specify recipient</Trans>
        </Typography>
      </ParagraphContainer>
      <SenderDetails />
      <ParagraphContainer top={SpacingSize.XXXL}>
        <Typography type="bodySemiBold">
          <Trans t={t}>To recipient</Trans>
        </Typography>
      </ParagraphContainer>
      <TransferInputContainer>
        <Input
          monotype
          placeholder={t('Recipient public address')}
          {...register('recipientPublicKey')}
          error={!!errors?.recipientPublicKey}
          validationText={errors?.recipientPublicKey?.message}
          listId="recipient-public-keys"
          listOptions={recentRecipientPublicKeys}
        />
      </TransferInputContainer>
    </ContentContainer>
  );
};
