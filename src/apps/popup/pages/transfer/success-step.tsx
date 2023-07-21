import React from 'react';
import { Trans, useTranslation } from 'react-i18next';

import {
  ContentContainer,
  ParagraphContainer,
  SpacingSize,
  VerticalSpaceContainer
} from '@src/libs/layout';
import { SvgIcon, Typography } from '@libs/ui';

export const SuccessStep = () => {
  const { t } = useTranslation();

  return (
    <ContentContainer>
      <ParagraphContainer top={SpacingSize.XL}>
        <SvgIcon src="assets/illustrations/success.svg" size={120} />
        <VerticalSpaceContainer top={SpacingSize.XL}>
          <Typography type="header">
            <Trans t={t}>You submitted a transaction</Trans>
          </Typography>
        </VerticalSpaceContainer>
        <VerticalSpaceContainer top={SpacingSize.Medium}>
          <Typography type="body" color="contentSecondary">
            <Trans t={t}>
              You can check its status in the Deploys tab on your Wallet home
              page.
            </Trans>
          </Typography>
        </VerticalSpaceContainer>
      </ParagraphContainer>
    </ContentContainer>
  );
};
