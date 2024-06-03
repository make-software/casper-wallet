import React from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { useTypedLocation } from '@import-account-with-file/router';

import {
  ContentContainer,
  IllustrationContainer,
  ParagraphContainer,
  SpacingSize
} from '@libs/layout';
import { SvgIcon, Typography } from '@libs/ui/components';

export function ImportAccountWithFileFailureContentPage() {
  const { t } = useTranslation();
  const location = useTypedLocation();
  const state = location.state;

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
          {state?.importAccountStatusMessage
            ? state.importAccountStatusMessage
            : t(
                ': We couldn’t import your account. Please confirm that you’re importing a file containing your secret key (not to be confused with your public key).'
              )}
        </Typography>
      </ParagraphContainer>
    </ContentContainer>
  );
}
