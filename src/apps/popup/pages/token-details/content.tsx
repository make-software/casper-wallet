import React from 'react';
import { Trans, useTranslation } from 'react-i18next';

import {
  ContentContainer,
  ParagraphContainer,
  SpacingSize
} from '@libs/layout';
import { ActivityList, Typography } from '@libs/ui';

import { Token } from './token';
import { useErc20Tokens } from '@src/hooks';

export const TokenPageContent = () => {
  const { t } = useTranslation();

  const erc20Tokens = useErc20Tokens();

  return (
    <ContentContainer>
      <ParagraphContainer top={SpacingSize.XL}>
        <Typography type="header">
          <Trans t={t}>Token</Trans>
        </Typography>
      </ParagraphContainer>
      <Token erc20Tokens={erc20Tokens} />
      <ParagraphContainer top={SpacingSize.XL}>
        <Typography type="header">
          <Trans t={t}>Activity</Trans>
        </Typography>
      </ParagraphContainer>
      <ActivityList />
    </ContentContainer>
  );
};
