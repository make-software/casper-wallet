import React from 'react';
import { Trans, useTranslation } from 'react-i18next';

import {
  SpacingSize,
  TabPageContainer,
  TabTextContainer,
  VerticalSpaceContainer
} from '@libs/layout';
import { Typography } from '@libs/ui/components';

export function CreateSecretPhraseContent() {
  const { t } = useTranslation();

  return (
    <TabPageContainer>
      <Typography type="captionMedium" color="contentActionCritical" uppercase>
        <Trans t={t}>Step 2</Trans>
      </Typography>
      <VerticalSpaceContainer top={SpacingSize.Tiny}>
        <Typography type="headerBig">
          <Trans t={t}>Create secret recovery phrase</Trans>
        </Typography>
      </VerticalSpaceContainer>
      <TabTextContainer>
        <Typography type="body" color="contentSecondary">
          <Trans t={t}>
            Your unique secret recovery phrase allows you to recover your wallet
            at any time on any device that has Casper Wallet installed.
          </Trans>
        </Typography>
      </TabTextContainer>
    </TabPageContainer>
  );
}
