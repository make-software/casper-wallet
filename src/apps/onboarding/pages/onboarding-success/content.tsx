import React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import styled from 'styled-components';

import { TabPageContainer, TabTextContainer } from '@libs/layout';
import { SvgIcon, Typography } from '@libs/ui';

const TipContainer = styled.div`
  margin-top: 12px;
`;

export function OnboardingSuccessPageContent() {
  const { t } = useTranslation();

  return (
    <TabPageContainer>
      <SvgIcon src="assets/illustrations/success.svg" size={140} />
      <TabTextContainer>
        <Typography type="header">
          <Trans t={t}>Congrats! Your Casper wallet is ready to go</Trans>
        </Typography>
      </TabTextContainer>

      <TabTextContainer>
        <Typography type="bodySemiBold">
          <Trans t={t}>Learn the basics</Trans>
        </Typography>
      </TabTextContainer>
      <TipContainer>
        <Typography type="body" color="contentSecondary">
          <Trans t={t}>
            If this is your first time using a web wallet, we highly recommend
            visiting our Casper Academy to learn the basics (set aside 30 min or
            so for this).
          </Trans>
        </Typography>
      </TipContainer>

      <TabTextContainer>
        <Typography type="bodySemiBold">
          <Trans t={t}>Already know the basics?</Trans>
        </Typography>
      </TabTextContainer>
      <TipContainer>
        <Typography type="body" color="contentSecondary">
          <Trans t={t}>
            Start exploring the Casper ecosystem with this list of popular
            Casper Dapps.
          </Trans>
        </Typography>
      </TipContainer>
    </TabPageContainer>
  );
}
