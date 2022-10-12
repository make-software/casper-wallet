import React, { useState } from 'react';
import { useTranslation, Trans } from 'react-i18next';

import { LayoutTab, TabFooterContainer } from '@libs/layout';
import { Button, Checkbox } from '@libs/ui';

import { dispatchToMainStore } from '@background/redux/utils';
import { vaultReseted } from '@background/redux/vault/actions';

import { ResetWalletPageContent } from './content';
import { useTypedNavigate } from '@src/apps/onboarding/router';

// Design of this page is temporary. Should be changed after it will be done in Figma

export function ResetWalletPage() {
  const navigate = useTypedNavigate();
  const [isChecked, setIsChecked] = useState<boolean>(false);

  function handleResetVault() {
    dispatchToMainStore(vaultReseted());
  }

  function handleCancel() {
    navigate(-1);
  }

  const { t } = useTranslation();
  return (
    <LayoutTab
      layoutContext="withIllustration"
      renderContent={() => <ResetWalletPageContent />}
      renderFooter={() => (
        <TabFooterContainer>
          <Checkbox
            checked={isChecked}
            onChange={() => setIsChecked(currentValue => !currentValue)}
            label={t('I’ve read and understand the above')}
          />
          <Button
            color="primaryRed"
            disabled={!isChecked}
            onClick={handleResetVault}
          >
            <Trans t={t}>Reset wallet</Trans>
          </Button>
          <Button onClick={handleCancel} color="secondaryBlue">
            <Trans t={t}>Cancel</Trans>
          </Button>
        </TabFooterContainer>
      )}
    />
  );
}
