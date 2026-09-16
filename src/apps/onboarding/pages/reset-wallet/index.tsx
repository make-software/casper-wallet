import React, { useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { useTypedNavigate } from '@onboarding/router';

import { resetVault } from '@background/redux/sagas/actions';
import { dispatchToMainStore } from '@background/redux/utils';

import { LayoutTab, TabFooterContainer } from '@libs/layout';
import { Button, Checkbox } from '@libs/ui/components';

import { ResetWalletPageContent } from './content';

export function ResetWalletPage() {
  const navigate = useTypedNavigate();
  const [isChecked, setIsChecked] = useState<boolean>(false);

  function handleResetVault() {
    dispatchToMainStore(resetVault());
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
            <Trans t={t}>Start again</Trans>
          </Button>
          <Button onClick={handleCancel} color="secondaryBlue">
            <Trans t={t}>Cancel</Trans>
          </Button>
        </TabFooterContainer>
      )}
    />
  );
}
