import React from 'react';
import { UseFormRegister } from 'react-hook-form';
import { useTranslation, Trans } from 'react-i18next';

import {
  ContentContainer,
  IllustrationContainer,
  ParagraphContainer,
  InputsContainer,
  SpacingSize
} from '@src/libs/layout';
import { Typography, Input, SvgIcon } from '@src/libs/ui';
import { CreateAccountFormValues } from '@src/libs/ui/forms/create-account';

interface CreateAccountPageContentProps {
  register: UseFormRegister<CreateAccountFormValues>;
  errorMessage?: string;
}

export function CreateAccountPageContent({
  register,
  errorMessage
}: CreateAccountPageContentProps) {
  const { t } = useTranslation();

  return (
    <ContentContainer>
      <IllustrationContainer>
        <SvgIcon
          src="assets/illustrations/create-account.svg"
          width={195}
          height={120}
        />
      </IllustrationContainer>
      <ParagraphContainer top={SpacingSize.Medium}>
        <Typography type="header">
          <Trans t={t}>Create account</Trans>
        </Typography>
      </ParagraphContainer>
      <ParagraphContainer top={SpacingSize.Medium}>
        <Typography type="body" color="contentSecondary">
          <Trans t={t}>
            New accounts are recovered using your Casper Wallet’s secret
            recovery phrase.
          </Trans>
        </Typography>
      </ParagraphContainer>
      <InputsContainer>
        <Input
          type="text"
          placeholder={t('Account name')}
          {...register('name')}
          error={!!errorMessage}
          validationText={errorMessage}
        />
      </InputsContainer>
    </ContentContainer>
  );
}
