import React from 'react';

import {
  PageContainer,
  ContentContainer,
  IllustrationContainer,
  OnboardingIllustrationContainer,
  ParagraphContainer,
  SpacingSize
} from '@src/libs/layout';
import { Typography } from '@src/libs/ui';

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
            <img
              src="assets/illustrations/wrong-secret-phrase.png"
              width={200}
              height={120}
              alt="wrong secret phrase"
            />
          </OnboardingIllustrationContainer>
        ) : (
          <IllustrationContainer>
            <img
              src="assets/illustrations/error.png"
              width={200}
              height={120}
              alt="error"
            />
          </IllustrationContainer>
        )}

        <ParagraphContainer top={SpacingSize.XL}>
          <Typography type="header">{errorHeaderText}</Typography>
        </ParagraphContainer>

        <ParagraphContainer top={SpacingSize.Medium}>
          <Typography type="body" color="contentSecondary">
            {errorContentText}
          </Typography>
        </ParagraphContainer>
      </ContentContainer>
    </PageContainer>
  );
}
