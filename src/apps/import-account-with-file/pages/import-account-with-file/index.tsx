import React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import {
  FooterButtonsContainer,
  HeaderPopup,
  LayoutWindow
} from '@libs/layout';
import { Button } from '@libs/ui/components';

import { RouterPath } from '../../router';
import { ImportAccountWithFileContentPage } from './content';

export function ImportAccountWithFilePage() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <LayoutWindow
      renderHeader={() => <HeaderPopup />}
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
