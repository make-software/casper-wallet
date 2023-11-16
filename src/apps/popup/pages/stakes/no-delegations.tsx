import React from 'react';
import { Trans, useTranslation } from 'react-i18next';

import {
  ContentContainer,
  ParagraphContainer,
  SpacingSize
} from '@libs/layout';
import { SvgIcon, Typography } from '@libs/ui';

export const NoDelegations = () => {
  const { t } = useTranslation();

  return (
    <ContentContainer>
      <ParagraphContainer top={SpacingSize.XL}>
        <SvgIcon src="assets/icons/empty-state.svg" height={120} width={296} />
      </ParagraphContainer>
      <ParagraphContainer top={SpacingSize.XL}>
        <Typography type="header">
          <Trans t={t}>You haven’t delegated with this account yet</Trans>
        </Typography>
      </ParagraphContainer>
      <ParagraphContainer top={SpacingSize.Large}>
        <Typography type="body" color="contentSecondary">
          <Trans t={t}>
            You can only undelegate if you’ve delegated from this account
            before.
          </Trans>
        </Typography>
      </ParagraphContainer>
    </ContentContainer>
  );
};
