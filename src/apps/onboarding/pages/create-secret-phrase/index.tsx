import React from 'react';
import { Trans, useTranslation } from 'react-i18next';

import {
  LayoutTab,
  TabHeaderContainer,
  TabFooterContainer,
  HeaderSubmenuBarNavLink
} from '@libs/layout';
import { Button } from '@libs/ui';

import { useTypedNavigate } from '@src/apps/onboarding/router/use-typed-navigate';
import { RouterPath } from '@src/apps/onboarding/router';
import { Stepper } from '@src/apps/onboarding/components/stepper';

import { CreateSecretPhraseContent } from './content';

export function CreateSecretPhrasePage() {
  const navigate = useTypedNavigate();
  const { t } = useTranslation();

  return (
    <LayoutTab
      layoutContext="withStepper"
      renderHeader={() => (
        <TabHeaderContainer>
          <HeaderSubmenuBarNavLink linkType="back" />
          <Stepper length={6} activeIndex={1} />
        </TabHeaderContainer>
      )}
      renderContent={() => <CreateSecretPhraseContent />}
      renderFooter={() => (
        <TabFooterContainer>
          <Button
            onClick={() => navigate(RouterPath.CreateSecretPhraseConfirmation)}
          >
            <Trans t={t}>Create my secret phrase</Trans>
          </Button>
          <Button
            color="secondaryBlue"
            onClick={() => navigate(RouterPath.RecoverFromSecretPhrase)}
          >
            <Trans t={t}>I already have a secret phrase</Trans>
          </Button>
        </TabFooterContainer>
      )}
    />
  );
}
