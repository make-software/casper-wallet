import React from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { RouterPath } from '@onboarding/router';
import { useTypedNavigate } from '@onboarding/router/use-typed-navigate';

import { resetVault } from '@background/redux/sagas/actions';
import { dispatchToMainStore } from '@background/redux/utils';

import { LayoutTab, TabFooterContainer } from '@libs/layout';
import { Button } from '@libs/ui';

import { WelcomePageContent } from './content';

export function WelcomePage() {
  const navigate = useTypedNavigate();
  const { t } = useTranslation();

  const handleClick = () => {
    dispatchToMainStore(resetVault()).then(() => {
      navigate(RouterPath.CreateVaultPassword);
    });
  };

  return (
    <LayoutTab
      layoutContext="withIllustration"
      renderContent={() => <WelcomePageContent />}
      renderFooter={() => (
        <TabFooterContainer>
          <Button onClick={handleClick} color="primaryRed">
            <Trans t={t}>Get started</Trans>
          </Button>
        </TabFooterContainer>
      )}
    />
  );
}
