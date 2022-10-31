import React from 'react';
import { FieldValues, UseFormRegister } from 'react-hook-form';
import { useTranslation, Trans } from 'react-i18next';

import {
  ContentContainer,
  IllustrationContainer,
  TextContainer,
  InputsContainer
} from '@src/libs/layout';
import { SvgIcon, Typography, Input } from '@src/libs/ui';

interface CreateAccountPageContentProps {
  register: UseFormRegister<FieldValues>;
  errorMessage: string | null;
}

export function CreateAccountPageContent({
  register,
  errorMessage
}: CreateAccountPageContentProps) {
  const { t } = useTranslation();

  return (
    <ContentContainer>
      <IllustrationContainer>
        <SvgIcon src="assets/illustrations/create-account.svg" size={120} />
      </IllustrationContainer>
      <TextContainer gap="big">
        <Typography type="header">
          <Trans t={t}>Create secure account</Trans>
        </Typography>
      </TextContainer>
      <TextContainer gap="medium">
        <Typography type="body" color="contentSecondary">
          <Trans t={t}>
            This account will be associated with your originally created secret
            phrase.
          </Trans>
        </Typography>
      </TextContainer>
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
