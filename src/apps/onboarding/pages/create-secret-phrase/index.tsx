import React from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { HeaderSubmenuBarNavLink } from '@libs/layout';
import { Button } from '@libs/ui';

import { FooterContainer } from '@src/apps/onboarding/layout/containers';
import { Layout } from '@src/apps/onboarding/layout';
import { CreateSecretPhraseContent } from '@src/apps/onboarding/pages/create-secret-phrase/content';

export function CreateSecretPhrasePage() {
  const { t } = useTranslation();

  return (
    <Layout
      renderHeader={() => <HeaderSubmenuBarNavLink linkType="back" />}
      renderContent={() => <CreateSecretPhraseContent />}
      contentBackgroundColor="backgroundSecondary"
      renderFooter={() => (
        <FooterContainer>
          <Button>
            <Trans t={t}>Create my secret phrase</Trans>
          </Button>
          <Button color="secondaryBlue">
            <Trans t={t}>I already have a secret phrase</Trans>
          </Button>
        </FooterContainer>
      )}
    />
  );
}
