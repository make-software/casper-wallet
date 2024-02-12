import React from 'react';
import { Trans, useTranslation } from 'react-i18next';

import {
  ContentContainer,
  IllustrationContainer,
  ParagraphContainer,
  SpacingSize
} from '@libs/layout';
import { SvgIcon, Typography } from '@libs/ui/components';

interface ContentProps {
  headerText: string;
  contentText: string;
  imageName: string;
}

export const Content = ({
  headerText,
  contentText,
  imageName
}: ContentProps) => {
  const { t } = useTranslation();

  return (
    <ContentContainer>
      <IllustrationContainer>
        <SvgIcon
          src={`assets/illustrations/${imageName}`}
          width={296}
          height={120}
        />
      </IllustrationContainer>

      <ParagraphContainer top={SpacingSize.XL}>
        <Typography type="header">
          <Trans t={t}>{headerText}</Trans>
        </Typography>
      </ParagraphContainer>

      <ParagraphContainer top={SpacingSize.Medium}>
        <Typography type="captionRegular" color="contentSecondary">
          <Trans t={t}>{contentText}</Trans>
        </Typography>
      </ParagraphContainer>
    </ContentContainer>
  );
};
