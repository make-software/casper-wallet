import React from 'react';
import { useTranslation, Trans } from 'react-i18next';

import {
  TabPageContainer,
  TabTextContainer,
  InputsContainer
} from '@libs/layout';
import { TextArea, Typography } from '@libs/ui';
import { FieldValues, UseFormRegister } from 'react-hook-form';

interface RecoverWalletFromSecretPhrasePageContentProps {
  register: UseFormRegister<FieldValues>;
}

export function RecoverWalletFromSecretPhrasePageContent({
  register
}: RecoverWalletFromSecretPhrasePageContentProps) {
  const { t } = useTranslation();
  return (
    <TabPageContainer>
      <Typography type="header">
        <Trans t={t}>Please enter your secret recovery phrase</Trans>
      </Typography>

      <TabTextContainer>
        <Typography type="body" color="contentSecondary">
          <Trans t={t}>
            While creating your Casper Signer wallet you’ve got a 24-word secret
            phrase. Please, enter each word of your secret phrase, separated by
            spacing.
          </Trans>
        </Typography>
      </TabTextContainer>
      <InputsContainer>
        <TextArea rows={6} {...register('phrase')} />
      </InputsContainer>
    </TabPageContainer>
  );
}