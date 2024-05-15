import React from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { closeCurrentWindow } from '@background/close-current-window';

import {
  FooterButtonsContainer,
  HeaderPopup,
  LayoutWindow
} from '@libs/layout';
import { Button } from '@libs/ui/components';

import { ImportAccountWithFileSuccessContentPage } from './content';

export const ImportAccountWithFileSuccessPage = () => {
  const { t } = useTranslation();

  return (
    <LayoutWindow
      renderHeader={() => <HeaderPopup />}
      renderContent={() => <ImportAccountWithFileSuccessContentPage />}
      renderFooter={() => (
        <FooterButtonsContainer>
          <Button onClick={closeCurrentWindow}>
            <Trans t={t}>Done</Trans>
          </Button>
        </FooterButtonsContainer>
      )}
    />
  );
};
