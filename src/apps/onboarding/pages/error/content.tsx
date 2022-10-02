import React from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { SvgIcon, Typography } from '@libs/ui';
import { TabPageContainer, TabTextContainer } from '@libs/layout';

export function ErrorPageContent() {
  const { t } = useTranslation();

  return (
    <TabPageContainer>
      <SvgIcon src="assets/illustrations/error.svg" size={140} />
      <TabTextContainer>
        <Typography type="header">
          <Trans t={t}>
            We can’t connect your wallet with this secret phrase
          </Trans>
        </Typography>
      </TabTextContainer>

      <TabTextContainer>
        <Typography type="body">
          <Trans t={t}>
            It could be you’ve made a mistake while entering it. Please try
            again.
          </Trans>
        </Typography>
      </TabTextContainer>
    </TabPageContainer>
  );
}
