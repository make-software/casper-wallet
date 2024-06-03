import React from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { RouterPath, useTypedNavigate } from '@import-account-with-file/router';

import { closeCurrentWindow } from '@background/close-current-window';

import {
  FooterButtonsContainer,
  HeaderPopup,
  LayoutWindow
} from '@libs/layout';
import { Button } from '@libs/ui/components';

import { ImportAccountWithFileFailureContentPage } from './content';

export const ImportAccountWithFileFailurePage = () => {
  const { t } = useTranslation();
  const navigate = useTypedNavigate();

  return (
    <LayoutWindow
      renderHeader={() => <HeaderPopup />}
      renderContent={() => <ImportAccountWithFileFailureContentPage />}
      renderFooter={() => (
        <FooterButtonsContainer>
          <Button onClick={() => navigate(RouterPath.ImportAccountWithFile)}>
            <Trans t={t}>Try to import again</Trans>
          </Button>
          <Button color="secondaryBlue" onClick={() => closeCurrentWindow()}>
            <Trans t={t}>Maybe later</Trans>
          </Button>
        </FooterButtonsContainer>
      )}
    />
  );
};
