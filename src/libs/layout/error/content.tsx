import React from 'react';

import {
  PageContainer,
  ContentContainer,
  IllustrationContainer,
  OnboardingIllustrationContainer,
  ParagraphContainer
} from '@src/libs/layout';
import { SvgIcon, Typography } from '@src/libs/ui';

import { ErrorContent } from './types';

interface ErrorPageContentProps extends ErrorContent {
  // TODO: I guess will be better pass it through location state. It require extending of location state type
  illustrationType: 'onboarding' | 'general';
}

export function ErrorPageContent({
  errorContentText,
  errorHeaderText,
  illustrationType
}: ErrorPageContentProps) {
  if (errorContentText == null || errorHeaderText == null) {
    throw new Error('Cannot render ErrorPage: not enough props');
  }

  return (
    <PageContainer>
      <ContentContainer>
        {illustrationType === 'onboarding' ? (
          <OnboardingIllustrationContainer>
            <SvgIcon src="assets/illustrations/error.svg" size={140} />
          </OnboardingIllustrationContainer>
        ) : (
          <IllustrationContainer>
            <SvgIcon src="assets/illustrations/process-error.svg" size={140} />
          </IllustrationContainer>
        )}

        <ParagraphContainer gap="big">
          <Typography type="header">{errorHeaderText}</Typography>
        </ParagraphContainer>

        <ParagraphContainer gap="medium">
          <Typography type="body" color="contentSecondary">
            {errorContentText}
          </Typography>
        </ParagraphContainer>
      </ContentContainer>
    </PageContainer>
  );
}
