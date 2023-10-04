import React from 'react';
import { useTranslation, Trans } from 'react-i18next';

import { Typography } from '@libs/ui';
import { TabPageContainer, TabTextContainer } from '@src/libs/layout';

export function WelcomePageContent() {
  const { t } = useTranslation();
  return (
    <TabPageContainer>
      <img
        src="assets/illustrations/welcome.png"
        width={225}
        height={120}
        alt="welcome"
      />
      <TabTextContainer>
        <Typography type="header">
          <Trans t={t}>Ready to create your new wallet?</Trans>
        </Typography>
      </TabTextContainer>

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
