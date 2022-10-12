import React from 'react';
import { useTranslation, Trans } from 'react-i18next';

import { TabPageContainer, TabTextContainer } from '@libs/layout';
import { Typography } from '@libs/ui';

// Design of this page is temporary. Should be changed after it will be done in Figma

export function ResetWalletPageContent() {
  const { t } = useTranslation();

  return (
    <TabPageContainer>
      <Typography type="header">
        <Trans t={t}>
          Are you sure you want to reset your wallet password?
        </Trans>
      </Typography>

      <TabTextContainer>
        <Typography type="body" color="contentSecondary">
          <Trans t={t}>
            You'll be able to set your wallet password again starting the
            onboarding from the beggining.
          </Trans>
        </Typography>
      </TabTextContainer>
    </TabPageContainer>
  );
}
