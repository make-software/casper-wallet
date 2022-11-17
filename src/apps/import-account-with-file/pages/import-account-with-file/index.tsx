import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Trans, useTranslation } from 'react-i18next';

import {
  FooterButtonsContainer,
  LayoutWindow,
  PopupHeader
} from '@libs/layout';
import { Button } from '@libs/ui';
import { RouterPath } from '../../router';

import { ImportAccountWithFileContentPage } from './content';

export function ImportAccountWithFilePage() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <LayoutWindow
      variant="default"
      renderHeader={() => <PopupHeader />}
      renderContent={() => <ImportAccountWithFileContentPage />}
      renderFooter={() => (
        <FooterButtonsContainer>
          <Button
            onClick={() => navigate(RouterPath.ImportAccountWithFileUpload)}
          >
            <Trans t={t}>Upload your file</Trans>
          </Button>
        </FooterButtonsContainer>
      )}
    />
  );
}
