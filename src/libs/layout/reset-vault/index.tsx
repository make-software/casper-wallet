import React, { useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { closeWindowByReloadExtension } from '@background/close-window-by-reload-extension';
import { resetVault } from '@background/redux/sagas/actions';
import { dispatchToMainStore } from '@background/redux/utils';

import {
  FooterButtonsContainer,
  HeaderPopup,
  LayoutWindow,
  PopupLayout
} from '@libs/layout';
import { Button, Checkbox } from '@libs/ui/components';

import { ResetVaultPageContent } from './content';

interface ResetVaultPageProps {
  popupLayout?: boolean;
}

export const ResetVaultPage = ({ popupLayout }: ResetVaultPageProps) => {
  const [isChecked, setIsChecked] = useState(false);

  const navigate = useNavigate();
  const { t } = useTranslation();

  function handleResetVault() {
    dispatchToMainStore(resetVault()).then(() => {
      closeWindowByReloadExtension();
    });
  }

  function handleCancel() {
    navigate(-1);
  }

  const footer = (
    <FooterButtonsContainer>
      <Checkbox
        label={t('I’ve read and understand the above')}
        checked={isChecked}
        onChange={(value: boolean) => {
          setIsChecked(value);
        }}
      />
      <Button
        onClick={handleResetVault}
        color="primaryRed"
        disabled={!isChecked}
      >
        <Trans t={t}>Reset wallet</Trans>
      </Button>
      <Button onClick={handleCancel} color="secondaryBlue">
        <Trans t={t}>Cancel</Trans>
      </Button>
    </FooterButtonsContainer>
  );

  return popupLayout ? (
    <PopupLayout
      renderHeader={() => <HeaderPopup />}
      renderContent={() => <ResetVaultPageContent />}
      renderFooter={() => footer}
    />
  ) : (
    <LayoutWindow
      renderHeader={() => <HeaderPopup />}
      renderContent={() => <ResetVaultPageContent />}
      renderFooter={() => footer}
    />
  );
};
