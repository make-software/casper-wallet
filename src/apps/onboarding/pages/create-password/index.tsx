import React, { useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { HeaderSubmenuBarNavLink } from '@libs/layout';
import { Button, Checkbox } from '@libs/ui';

import { FooterContainer } from '@onboarding/layout/containers';
import { Layout } from '@onboarding/layout';

import { CreatePasswordPageContent } from './content';

export function CreatePasswordPage() {
  const [isChecked, setIsChecked] = useState(false);
  const { t } = useTranslation();

  return (
    <Layout
      renderHeader={() => <HeaderSubmenuBarNavLink linkType="back" />}
      renderContent={() => <CreatePasswordPageContent />}
      contentBackgroundColor="backgroundSecondary"
      renderFooter={() => (
        <FooterContainer>
          <Checkbox
            checked={isChecked}
            onChange={() => setIsChecked(currentValue => !currentValue)}
            label={t('I have read and agreed to the Terms of Use')}
          />
          <Button disabled={!isChecked}>
            <Trans t={t}>Create password</Trans>
          </Button>
        </FooterContainer>
      )}
    />
  );
}
