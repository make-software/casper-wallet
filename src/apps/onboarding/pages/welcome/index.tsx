import React from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { Button } from '@libs/ui';
import { LayoutTab, TabFooterContainer } from '@src/libs/layout';

import { useTypedNavigate } from '@src/apps/onboarding/router/use-typed-navigate';
import { RouterPath } from '@src/apps/onboarding/router';

import { WelcomePageContent } from './content';
import { dispatchToMainStore } from '@src/background/redux/utils';
import { resetVault } from '@src/background/redux/sagas/actions';

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
