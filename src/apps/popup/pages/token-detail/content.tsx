import React from 'react';
import { Trans, useTranslation } from 'react-i18next';

import {
  ContentContainer,
  ParagraphContainer,
  SpacingSize
} from '@libs/layout';
import { Typography } from '@libs/ui';
import { Token } from '@popup/pages/token-detail/token';

export const TokenPageContent = () => {
  const { t } = useTranslation();

  return (
    <ContentContainer>
      <ParagraphContainer top={SpacingSize.XL}>
        <Typography type="header">
          <Trans t={t}>Token</Trans>
        </Typography>
      </ParagraphContainer>
      <Token />
    </ContentContainer>
  );
};
