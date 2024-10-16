import React from 'react';

import {
  ContentContainer,
  IllustrationContainer,
  OnboardingIllustrationContainer,
  PageContainer,
  ParagraphContainer,
  SpacingSize
} from '@libs/layout';
import { SvgIcon, Typography } from '@libs/ui/components';

import { ErrorContent } from './types';

interface ErrorPageContentProps extends ErrorContent {
  // TODO: I guess will be better pass it through location state. It require extending of location state type
  pageType: 'onboarding' | 'general';
}

export function ErrorPageContent({
  errorContentText,
  errorHeaderText,
  pageType
}: ErrorPageContentProps) {
  if (errorContentText == null || errorHeaderText == null) {
    throw new Error('Cannot render ErrorPage: not enough props');
  }

  return (
    <PageContainer>
      <ContentContainer>
        {pageType === 'onboarding' ? (
          <OnboardingIllustrationContainer>
            <SvgIcon
              src="assets/illustrations/wrong-secret-phrase.svg"
              width={200}
              height={120}
            />
          </OnboardingIllustrationContainer>
        ) : (
          <IllustrationContainer>
            <SvgIcon
              src="assets/illustrations/error.svg"
              width={200}
              height={120}
            />
          </IllustrationContainer>
        )}

        <ParagraphContainer top={SpacingSize.XL}>
          <Typography type={pageType === 'onboarding' ? 'headerBig' : 'header'}>
            {errorHeaderText}
          </Typography>
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
