import React, { useEffect } from 'react';
import { useTranslation, Trans } from 'react-i18next';
import styled from 'styled-components';

import { getFaviconUrlFromOrigin, SvgIcon, Typography } from '@libs/ui';
import { closeActiveWindow } from '@src/background/close-window';

const PageContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  height: 100%;
  width: 100%;
`;

const IconsContainer = styled.div`
  display: flex;
  align-items: center;

  margin-top: 32px;
  gap: 16px;
`;

const LogoOverlay = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;

  width: 80px;
  height: 80px;
  border-radius: ${({ theme }) => theme.borderRadius.eighty}px;

  background-color: ${({ theme }) => theme.color.contentOnFill};
`;

const AppLogoImg = styled.img`
  width: 40px;
  height: 40px;
`;

export function ConnectingContent() {
  const { t } = useTranslation();

  useEffect(() => {
    setTimeout(() => closeActiveWindow(), 1000);
  }, []);

  const faviconUrl = getFaviconUrlFromOrigin(origin);

  return (
    <PageContainer>
      <Typography type="header">
        <Trans t={t}>Connecting</Trans>
      </Typography>
      <IconsContainer>
        <LogoOverlay>
          <SvgIcon src="assets/icons/logo.svg" size={40} color="contentRed" />
        </LogoOverlay>
        <SvgIcon src="assets/illustrations/connection.svg" size={76} />
        <LogoOverlay>
          {/* TODO: handle null-favicon-url case */}
          {faviconUrl && <AppLogoImg src={faviconUrl} alt="favicon" />}
        </LogoOverlay>
      </IconsContainer>
    </PageContainer>
  );
}
