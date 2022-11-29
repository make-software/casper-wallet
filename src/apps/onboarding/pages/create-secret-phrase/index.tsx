import React from 'react';
import { Trans, useTranslation } from 'react-i18next';

import {
  HeaderSubmenuBarNavLink,
  LayoutTab,
  TabFooterContainer,
  TabHeaderContainer
} from '@libs/layout';
import { Button } from '@libs/ui';
import { Stepper } from '@src/apps/onboarding/components/stepper';
import { RouterPath } from '@src/apps/onboarding/router';
import { useTypedNavigate } from '@src/apps/onboarding/router/use-typed-navigate';
import { dispatchToMainStore } from '@src/background/redux/utils';

import { CreateSecretPhraseContent } from './content';
import { resetVault } from '@src/background/redux/sagas/actions';

export function CreateSecretPhrasePage() {
  const navigate = useTypedNavigate();
  const { t } = useTranslation();

  const handleBack = () => {
    dispatchToMainStore(resetVault());
    navigate(RouterPath.CreateVaultPassword);
  };

  return (
    <LayoutTab
      layoutContext="withStepper"
      renderHeader={() => (
        <TabHeaderContainer>
          <HeaderSubmenuBarNavLink linkType="back" onClick={handleBack} />
          <Stepper length={6} activeIndex={1} />
        </TabHeaderContainer>
      )}
      renderContent={() => <CreateSecretPhraseContent />}
      renderFooter={() => (
        <TabFooterContainer>
          <Button
            onClick={() => navigate(RouterPath.CreateSecretPhraseConfirmation)}
          >
            <Trans t={t}>Create my secret recovery phrase</Trans>
          </Button>
          <Button
            color="secondaryBlue"
            onClick={() => navigate(RouterPath.RecoverFromSecretPhrase)}
          >
            <Trans t={t}>Import an existing secret recovery phrase</Trans>
          </Button>
        </TabFooterContainer>
      )}
    />
  );
}
