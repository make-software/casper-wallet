import React from 'react';
import { useTranslation, Trans } from 'react-i18next';
import styled from 'styled-components';

import {
  ContentContainer,
  HeaderTextContainer,
  TextContainer,
  FooterButtonsAbsoluteContainer
} from '@src/layout';
import { Typography, SvgIcon, Button } from '@libs/ui';

import { useTypedNavigate, RouterPath } from '@popup/router';

const IllustrationContainer = styled.div`
  margin: 24px 16px 0 16px;
`;

export function NoConnectedAccountPageContent() {
  const navigate = useTypedNavigate();
  const { t } = useTranslation();

  return (
    <ContentContainer>
      <IllustrationContainer>
        <SvgIcon src="assets/illustrations/no-connection.svg" size={120} />
      </IllustrationContainer>
      <HeaderTextContainer>
        <Typography type="header" weight="bold">
          <Trans t={t}>Casper Signer is not connected to this site yet</Trans>
        </Typography>
      </HeaderTextContainer>
      <TextContainer>
        <Typography type="body" weight="regular" color="contentSecondary">
          <Trans t={t}>
            To connect to this site, find and click the connect button on the
            site
          </Trans>
        </Typography>
      </TextContainer>

      <FooterButtonsAbsoluteContainer>
        <Button onClick={() => navigate(RouterPath.Home)}>
          <Trans t={t}>Got it</Trans>
        </Button>
      </FooterButtonsAbsoluteContainer>
    </ContentContainer>
  );
}
