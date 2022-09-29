import React from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { HeaderSubmenuBarNavLink } from '@libs/layout';
import { FooterContainer } from '@onboarding/layout/containers';
import { Button } from '@libs/ui';
import { Layout } from '@onboarding/layout';
import { CreateSecretPhraseContent } from '@onboarding/pages/create-secret-phrase/content';

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
