import { Player } from '@lottiefiles/react-lottie-player';
import React from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { ledgerSupportLink } from '@src/constants';

import { useIsDarkMode } from '@hooks/use-is-dark-mode';

import dotsDarkModeAnimation from '@libs/animations/dots_dark_mode.json';
import dotsLightModeAnimation from '@libs/animations/dots_light_mode.json';
import {
  CenteredFlexColumn,
  ContentContainer,
  HeaderPopup,
  HeaderSubmenuBarNavLink,
  IllustrationContainer,
  ParagraphContainer,
  PopupLayout,
  SpacingSize
} from '@libs/layout';
import { Link, SvgIcon, Typography } from '@libs/ui/components';

export const NotConnectedLedger = () => {
  const { t } = useTranslation();
  const isDarkMode = useIsDarkMode();

  return (
    <PopupLayout
      renderHeader={() => (
        <HeaderPopup
          withNetworkSwitcher
          withMenu
          withConnectionStatus
          renderSubmenuBarItems={() => (
            <HeaderSubmenuBarNavLink linkType="close" />
          )}
        />
      )}
      renderContent={() => (
        <ContentContainer>
          <IllustrationContainer>
            <SvgIcon
              src="assets/illustrations/ledger-connect.svg"
              width={296}
              height={120}
            />
          </IllustrationContainer>
          <ParagraphContainer top={SpacingSize.XL}>
            <Typography type="header">
              <Trans t={t}>Now please open Casper app on your Ledger</Trans>
            </Typography>
          </ParagraphContainer>
          <ParagraphContainer top={SpacingSize.Medium}>
            <Typography type="body" color="contentSecondary">
              <Trans t={t}>to connect with Casper Wallet.</Trans>{' '}
              <Link
                color="contentAction"
                target="_blank"
                href={ledgerSupportLink}
                title={t('Learn more about Ledger')}
              >
                <Trans t={t}>Learn more about Ledger</Trans>
              </Link>
            </Typography>
          </ParagraphContainer>
          <CenteredFlexColumn>
            <Player
              renderer="svg"
              autoplay
              loop
              src={isDarkMode ? dotsDarkModeAnimation : dotsLightModeAnimation}
              style={{ height: '142px' }}
            />
          </CenteredFlexColumn>
        </ContentContainer>
      )}
    />
  );
};
