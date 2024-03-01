import React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import styled from 'styled-components';

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

const ledgerSupportLink =
  'https://support.ledger.com/hc/en-us/articles/4416379141009-Casper-CSPR?docs=true';

const AnimationContainer = styled(CenteredFlexColumn)`
  margin-top: 60px;
`;

export const NotConnectedLedger = () => {
  const { t } = useTranslation();

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
          <AnimationContainer>animation</AnimationContainer>
        </ContentContainer>
      )}
    />
  );
};
