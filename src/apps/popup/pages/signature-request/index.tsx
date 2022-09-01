import React from 'react';
import { useTranslation, Trans } from 'react-i18next';

import { Typography } from '@libs/ui';
import { ContentContainer, HeaderTextContainer } from '@layout/containers';

import { SigningRequest } from './types';

interface SignatureRequestPageProps {
  request: SigningRequest;
}

export function SignatureRequestPage({ request }: SignatureRequestPageProps) {
  const { t } = useTranslation();
  return (
    <ContentContainer>
      <HeaderTextContainer>
        <Typography type="header" weight="bold">
          <Trans t={t}>Signature Request</Trans>
        </Typography>
      </HeaderTextContainer>
    </ContentContainer>
  );
}

export * from './mocked-data';
