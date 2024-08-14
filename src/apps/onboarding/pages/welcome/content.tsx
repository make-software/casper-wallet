import React from 'react';
import { Trans, useTranslation } from 'react-i18next';

import {
  SpacingSize,
  TabPageContainer,
  TabTextContainer,
  VerticalSpaceContainer
} from '@libs/layout';
import { SvgIcon, Typography } from '@libs/ui/components';

export function WelcomePageContent() {
  const { t } = useTranslation();
  return (
    <TabPageContainer>
      <SvgIcon
        src="assets/illustrations/welcome.svg"
        width={225}
        height={120}
      />
      <VerticalSpaceContainer top={SpacingSize.XXXL}>
        <Typography type="headerBig">
          <Trans t={t}>Ready to create your new wallet?</Trans>
        </Typography>
      </VerticalSpaceContainer>

      <TabTextContainer>
        <Typography type="body" color="contentSecondary">
          <Trans t={t}>
            With a Casper Wallet you can create unlimited accounts, view your
            account balance, and securely sign transactions on the Casper
            Network.
          </Trans>
        </Typography>
      </TabTextContainer>
      <TabTextContainer>
        <Typography type="body" color="contentSecondary">
          <Trans t={t}>
            Tip: Have a pen and paper handy. You’ll need to write down your
            wallet’s secret recovery phrase.
          </Trans>
        </Typography>
      </TabTextContainer>
    </TabPageContainer>
  );
}
