import React from 'react';
import { Trans, useTranslation } from 'react-i18next';

import {
  ContentContainer,
  IllustrationContainer,
  ParagraphContainer,
  SpacingSize
} from '@libs/layout';
import { SvgIcon, Tips, Typography } from '@libs/ui/components';

import { instructionList } from './utils';

export const Instruction = () => {
  const { t } = useTranslation();

  return (
    <ContentContainer>
      <IllustrationContainer>
        <SvgIcon
          src="assets/illustrations/import-account-from-torus.svg"
          width={296}
          height={120}
        />
      </IllustrationContainer>

      <ParagraphContainer top={SpacingSize.XL}>
        <Typography type="header">
          <Trans t={t}>Import account from Torus Wallet</Trans>
        </Typography>
      </ParagraphContainer>

      <ParagraphContainer top={SpacingSize.Medium}>
        <Typography type="body" color="contentSecondary">
          <Trans t={t}>
            Please note, that accounts imported with a secret key cannot be
            recovered using your Casper Wallet secret recovery phrase.
          </Trans>
        </Typography>
      </ParagraphContainer>

      <Tips list={instructionList} />
    </ContentContainer>
  );
};
