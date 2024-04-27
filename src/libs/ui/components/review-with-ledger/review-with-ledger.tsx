import { Player } from '@lottiefiles/react-lottie-player';
import React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import styled from 'styled-components';

import { useIsDarkMode } from '@hooks/use-is-dark-mode';

import dotsDarkModeAnimation from '@libs/animations/dots_dark_mode.json';
import dotsLightModeAnimation from '@libs/animations/dots_light_mode.json';
import {
  CenteredFlexColumn,
  ContentContainer,
  ParagraphContainer,
  SpacingSize,
  VerticalSpaceContainer
} from '@libs/layout';
import { FormField, TextArea, Typography } from '@libs/ui/components';

interface ReviewWithLedgerProps {
  hash: string;
  hashLabel: string;
}

const HeaderTextContainer = styled(ParagraphContainer)`
  //  We are using this instead of 'top' prop in <ParagraphContainer>, because there is a problem with height when we call it in layout window
  padding-top: 24px;
`;

export const ReviewWithLedger = ({
  hash,
  hashLabel
}: ReviewWithLedgerProps) => {
  const { t } = useTranslation();
  const isDarkMode = useIsDarkMode();

  return (
    <ContentContainer>
      <HeaderTextContainer>
        <Typography type="header">
          <Trans t={t}>Review and sign with Ledger </Trans>
        </Typography>
      </HeaderTextContainer>
      <ParagraphContainer top={SpacingSize.Medium}>
        <Typography type="body" color="contentSecondary">
          <Trans
            t={t}
          >{`Compare the ${hashLabel.toLowerCase()} on your Ledger device with the value
            below and approve or reject the signature.`}</Trans>
        </Typography>
      </ParagraphContainer>
      <VerticalSpaceContainer top={SpacingSize.Large}>
        <FormField label={t(hashLabel)}>
          <TextArea value={hash} readOnly rows={2} type="captionHash" />
        </FormField>
      </VerticalSpaceContainer>
      <CenteredFlexColumn>
        <Player
          renderer="svg"
          autoplay
          loop
          src={isDarkMode ? dotsDarkModeAnimation : dotsLightModeAnimation}
          style={{ height: '142px' }}
        />
      </CenteredFlexColumn>
    </ContentContainer>
  );
};
