import React from 'react';
import { useTranslation, Trans } from 'react-i18next';

import {
  LayoutTab,
  TabFooterContainer,
  HeaderSubmenuBarNavLink
} from '@libs/layout';
import { Button } from '@libs/ui';

import { RouterPath } from '@src/apps/onboarding/router';
import { useTypedNavigate } from '@src/apps/onboarding/router/use-typed-navigate';

import { ConfirmSecretPhrasePageContent } from './content';

export function ConfirmSecretPhrasePage() {
  const navigate = useTypedNavigate();
  const { t } = useTranslation();

  return (
    <LayoutTab
      layoutContext="withStepper"
      renderHeader={() => <HeaderSubmenuBarNavLink linkType="back" />}
      renderContent={() => <ConfirmSecretPhrasePageContent />}
      renderFooter={() => (
        <TabFooterContainer>
          <Button
            onClick={() => navigate(RouterPath.ConfirmSecretPhraseSuccess)}
          >
            <Trans t={t}>Confirm</Trans>
          </Button>
        </TabFooterContainer>
      )}
    />
  );
}
