import React from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { Typography } from '@libs/ui';
import { TabPageContainer, TabTextContainer } from '@src/libs/layout';

export function CreateSecretPhraseContent() {
  const { t } = useTranslation();

  return (
    <TabPageContainer>
      <Typography type="header">
        <Trans t={t}>Create secret phrase</Trans>
      </Typography>
      <TabTextContainer>
        <Typography type="body" color="contentSecondary">
          <Trans t={t}>
            Casper Signer doesn’t have a “Reset password” feature. All you get
            is a secret phrase, which makes it easy to back up and restore your
            account.
          </Trans>
        </Typography>
      </TabTextContainer>
    </TabPageContainer>
  );
}
