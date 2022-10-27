import React from 'react';
import { FieldValues, UseFormRegister } from 'react-hook-form';
import { useTranslation, Trans } from 'react-i18next';
import styled from 'styled-components';

import { ContentContainer, InputsContainer } from '@src/libs/layout';
import { SvgIcon, Typography, Input } from '@src/libs/ui';

const IllustrationContainer = styled.div`
  margin: 24px 16px 0;
`;

const HeaderTextContainer = styled.div`
  margin-top: 16px;
  padding: 0 ${({ theme }) => theme.padding[1.6]} 0;
`;

const TextContainer = styled.div`
  margin-top: 16px;
  padding: 0 ${({ theme }) => theme.padding[1.6]} 0;
`;

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
      <HeaderTextContainer>
        <Typography type="header">
          <Trans t={t}>Create secure account</Trans>
        </Typography>
      </HeaderTextContainer>
      <TextContainer>
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
