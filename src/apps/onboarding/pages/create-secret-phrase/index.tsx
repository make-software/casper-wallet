import React from 'react';
import { Trans, useTranslation } from 'react-i18next';

import {
  LayoutTab,
  HeaderSubmenuBarNavLink,
  TabFooterContainer
} from '@libs/layout';
import { Button } from '@libs/ui';

import { useTypedNavigate } from '@src/apps/onboarding/router/use-typed-navigate';
import { RouterPath } from '@src/apps/onboarding/router';

import { CreateSecretPhraseContent } from './content';

export function CreateSecretPhrasePage() {
  const navigate = useTypedNavigate();
  const { t } = useTranslation();

  return (
    <LayoutTab
      layoutContext="withStepper"
      renderHeader={() => <HeaderSubmenuBarNavLink linkType="back" />}
      renderContent={() => <CreateSecretPhraseContent />}
      renderFooter={() => (
        <TabFooterContainer>
          <Button
            onClick={() => navigate(RouterPath.SecretPhraseSecurityNotes)}
          >
            <Trans t={t}>Create my secret phrase</Trans>
          </Button>
          <Button
            color="secondaryBlue"
            onClick={() => navigate(RouterPath.RecoverWalletFromSecretPhrase)}
          >
            <Trans t={t}>I already have a secret phrase</Trans>
          </Button>
        </TabFooterContainer>
      )}
    />
  );
}
