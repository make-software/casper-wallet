import React from 'react';
import { useTranslation, Trans } from 'react-i18next';

import { SvgIcon, Typography } from '@libs/ui';
import { TabPageContainer, TabTextContainer } from '@src/libs/layout';

export function WelcomePageContent() {
  const { t } = useTranslation();
  return (
    <TabPageContainer>
      <SvgIcon
        src="assets/illustrations/welcome.svg"
        width={264}
        height={140}
      />
      <TabTextContainer>
        <Typography type="header">
          <Trans t={t}>
            Welcome to Signer! Ready to create your new wallet?
          </Trans>
        </Typography>
      </TabTextContainer>

      <TabTextContainer>
        <Typography type="body" color="contentSecondary">
          <Trans t={t}>
            With a Casper Wallet you can send and receive funds, connect to
            Dapps, trade NFTs and so much more!
          </Trans>
        </Typography>
      </TabTextContainer>
    </TabPageContainer>
  );
}
