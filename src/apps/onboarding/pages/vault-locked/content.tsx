import React from 'react';
import { Trans, useTranslation } from 'react-i18next';

import {
  SpacingSize,
  TabPageContainer,
  TabTextContainer,
  VerticalSpaceContainer
} from '@libs/layout';
import { SvgIcon, Typography } from '@libs/ui/components';

export function VaultLockedPageContent() {
  const { t } = useTranslation();

  return (
    <TabPageContainer>
      <SvgIcon
        src="assets/illustrations/locked-wallet.svg"
        width={200}
        height={120}
      />
      <VerticalSpaceContainer top={SpacingSize.XXXL}>
        <Typography type="headerBig">
          <Trans t={t}>Your wallet is locked</Trans>
        </Typography>
      </VerticalSpaceContainer>

      <TabTextContainer>
        <Typography type="body" color="contentSecondary">
          <Trans t={t}>
            Open the Casper Wallet extension and enter your password to unlock
            it. This page cannot unlock your wallet for you.
          </Trans>
        </Typography>
      </TabTextContainer>

      <TabTextContainer>
        <Typography type="body" color="contentSecondary">
          <Trans t={t}>
            If you can’t remember your password, you can start again with your
            secret recovery phrase.
          </Trans>
        </Typography>
      </TabTextContainer>
    </TabPageContainer>
  );
}
