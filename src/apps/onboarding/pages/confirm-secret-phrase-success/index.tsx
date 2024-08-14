import React from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { Stepper } from '@onboarding/components/stepper';
import { RouterPath } from '@onboarding/router';
import { useTypedNavigate } from '@onboarding/router/use-typed-navigate';

import {
  HeaderSubmenuBarNavLink,
  LayoutTab,
  TabFooterContainer,
  TabHeaderContainer
} from '@libs/layout';
import { Button } from '@libs/ui/components';

import { ConfirmSecretPhraseSuccessPageContent } from './content';

export function ConfirmSecretPhraseSuccessPage() {
  const navigate = useTypedNavigate();
  const { t } = useTranslation();

  return (
    <LayoutTab
      layoutContext="withStepper"
      renderHeader={() => (
        <TabHeaderContainer>
          <HeaderSubmenuBarNavLink linkType="back" />
          <Stepper length={6} activeIndex={5} />
        </TabHeaderContainer>
      )}
      renderContent={() => <ConfirmSecretPhraseSuccessPageContent />}
      renderFooter={() => (
        <TabFooterContainer style={{ marginTop: '28px' }}>
          <Button onClick={() => navigate(RouterPath.OnboardingSuccess)}>
            <Trans t={t}>Done</Trans>
          </Button>
        </TabFooterContainer>
      )}
    />
  );
}
