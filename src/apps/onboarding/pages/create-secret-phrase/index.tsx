import React from 'react';
import { Trans, useTranslation } from 'react-i18next';

import {
  LayoutTab,
  HeaderSubmenuBarNavLink,
  TabFooterContainer
} from '@libs/layout';
import { Button } from '@libs/ui';

import { CreateSecretPhraseContent } from '@src/apps/onboarding/pages/create-secret-phrase/content';

export function CreateSecretPhrasePage() {
  const { t } = useTranslation();

  return (
    <LayoutTab
      layoutContext="withStepper"
      renderHeader={() => <HeaderSubmenuBarNavLink linkType="back" />}
      renderContent={() => <CreateSecretPhraseContent />}
      renderFooter={() => (
        <TabFooterContainer>
          <Button>
            <Trans t={t}>Create my secret phrase</Trans>
          </Button>
          <Button color="secondaryBlue">
            <Trans t={t}>I already have a secret phrase</Trans>
          </Button>
        </TabFooterContainer>
      )}
    />
  );
}
