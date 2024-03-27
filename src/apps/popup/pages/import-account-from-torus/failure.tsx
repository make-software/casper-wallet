import React from 'react';
import { Trans, useTranslation } from 'react-i18next';

import {
  ContentContainer,
  IllustrationContainer,
  ParagraphContainer,
  SpacingSize
} from '@libs/layout';
import { SvgIcon, Typography } from '@libs/ui/components';

interface ImportTorusAccountFailureProps {
  message?: string;
}

export const ImportTorusAccountFailure = ({
  message
}: ImportTorusAccountFailureProps) => {
  const { t } = useTranslation();

  return (
    <ContentContainer>
      <IllustrationContainer>
        <SvgIcon
          src="assets/illustrations/error.svg"
          width={200}
          height={120}
        />
      </IllustrationContainer>
      <ParagraphContainer top={SpacingSize.XL}>
        <Typography type="header">
          <Trans t={t}>Something went wrong</Trans>
        </Typography>
      </ParagraphContainer>
      <ParagraphContainer top={SpacingSize.Medium}>
        <Typography type="body" color="contentSecondary">
          {message
            ? message
            : 'We couldn’t import your account. Please confirm that you’re importing a secret key (not to be confused with your public key).'}
        </Typography>
      </ParagraphContainer>
    </ContentContainer>
  );
};
