import React from 'react';

import { SvgIcon, Typography } from '@libs/ui';
import { TabPageContainer, TabTextContainer } from '@libs/layout';

import { useTypedLocation } from '@src/apps/onboarding/router';

export function OnboardingErrorPageContent() {
  const location = useTypedLocation();
  const state = location.state;

  if (state?.errorContentText == null || state?.errorHeaderText == null) {
    throw new Error('Cannot render ErrorPage: not enough props');
  }

  return (
    <TabPageContainer>
      <SvgIcon src="assets/illustrations/error.svg" size={140} />
      <TabTextContainer>
        <Typography type="header">{state.errorHeaderText}</Typography>
      </TabTextContainer>

      <TabTextContainer>
        <Typography type="body">{state.errorContentText}</Typography>
      </TabTextContainer>
    </TabPageContainer>
  );
}
