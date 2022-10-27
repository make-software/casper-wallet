import React from 'react';
import { useTranslation, Trans } from 'react-i18next';
import styled from 'styled-components';

import { ContentContainer, IllustrationContainer } from '@src/libs/layout';
import { SvgIcon, Typography } from '@src/libs/ui';

const HeaderTextContainer = styled.div`
  margin-top: 16px;
  padding: 0 ${({ theme }) => theme.padding[1.6]} 0;
`;

const TextContainer = styled.div`
  margin-top: 16px;
  padding: 0 ${({ theme }) => theme.padding[1.6]} 0;
`;

export function DownloadedSecretKeysPageContent() {
  const { t } = useTranslation();
  return (
    <ContentContainer>
      <IllustrationContainer>
        <SvgIcon src="assets/illustrations/keys-downloaded.svg" size={120} />
      </IllustrationContainer>

      <HeaderTextContainer>
        <Typography type="header">
          <Trans t={t}>Your keys were downloaded</Trans>
        </Typography>
      </HeaderTextContainer>

      <TextContainer>
        <Typography type="body" color="contentSecondary">
          <Trans t={t}>Please keep them safe and secure.</Trans>
        </Typography>
      </TextContainer>
    </ContentContainer>
  );
}
