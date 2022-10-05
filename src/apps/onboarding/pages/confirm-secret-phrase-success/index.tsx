import React from 'react';
import { useTranslation, Trans } from 'react-i18next';

import {
  LayoutTab,
  TabFooterContainer,
  HeaderSubmenuBarNavLink
} from '@libs/layout';
import { Button } from '@libs/ui';

import { useTypedNavigate } from '@src/apps/onboarding/router/use-typed-navigate';
import { RouterPath } from '@src/apps/onboarding/router';

import { ConfirmSecretPhraseSuccessPageContent } from './content';

export function ConfirmSecretPhraseSuccessPage() {
  const navigate = useTypedNavigate();
  const { t } = useTranslation();

  return (
    <LayoutTab
      layoutContext="withStepper"
      renderHeader={() => <HeaderSubmenuBarNavLink linkType="back" />}
      renderContent={() => <ConfirmSecretPhraseSuccessPageContent />}
      renderFooter={() => (
        <TabFooterContainer>
          <Button onClick={() => navigate(RouterPath.OnboardingSuccess)}>
            <Trans t={t}>Done</Trans>
          </Button>
        </TabFooterContainer>
      )}
    />
  );
}
