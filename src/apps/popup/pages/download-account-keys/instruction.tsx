import React from 'react';
import { Trans, useTranslation } from 'react-i18next';

import {
  ContentContainer,
  ParagraphContainer,
  SpacingSize
} from '@libs/layout';
import { Tips, Typography } from '@libs/ui/components';

import { safetyTips } from './utils';

export const Instruction = () => {
  const { t } = useTranslation();

  return (
    <ContentContainer>
      <ParagraphContainer top={SpacingSize.XL}>
        <Typography type="header">
          <Trans t={t}>Please remember</Trans>
        </Typography>
      </ParagraphContainer>

      <ParagraphContainer top={SpacingSize.Medium}>
        <Typography type="body" color="contentSecondary">
          <Trans t={t}>
            Private key files are needed to recover access to your accounts.
          </Trans>
        </Typography>
      </ParagraphContainer>

      <Tips
        list={safetyTips}
        contentTop={SpacingSize.Small}
        label={t('Safety tips')}
      />
    </ContentContainer>
  );
};
