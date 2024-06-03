import React from 'react';
import { Trans, useTranslation } from 'react-i18next';

import {
  ContentContainer,
  IllustrationContainer,
  ParagraphContainer,
  SpacingSize
} from '@libs/layout';
import { SvgIcon, Typography } from '@libs/ui/components';

export function ResetVaultPageContent() {
  const { t } = useTranslation();

  return (
    <ContentContainer>
      <IllustrationContainer>
        <SvgIcon
          src="assets/illustrations/reset-wallet.svg"
          width={200}
          height={120}
        />
      </IllustrationContainer>
      <ParagraphContainer top={SpacingSize.XL}>
        <Typography type="header">
          <Trans t={t}>Are you sure you want to reset your wallet?</Trans>
        </Typography>
      </ParagraphContainer>
      <ParagraphContainer top={SpacingSize.Medium}>
        <Typography type="body" color="contentSecondary">
          <Trans t={t}>
            All accounts will be removed. Make sure you have securely stored
            your Casper Wallet’s secret recovery phrase and any legacy secret
            key files. Without them you may be unable to access the accounts.
          </Trans>
        </Typography>
      </ParagraphContainer>
    </ContentContainer>
  );
}
