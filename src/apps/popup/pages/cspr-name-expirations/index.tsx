import React from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { CSPR_NAME_URL } from '@src/constants';

import {
  FooterButtonsContainer,
  HeaderPopup,
  HeaderSubmenuBarNavLink,
  PopupLayout
} from '@libs/layout';
import { Button } from '@libs/ui/components';

import { CsprNameExpirationsContent } from './content';

export const CsprNameExpirationsPage: React.FC = () => {
  const { t } = useTranslation();

  return (
    <PopupLayout
      renderHeader={() => (
        <HeaderPopup
          withNetworkSwitcher
          withMenu
          withConnectionStatus
          renderSubmenuBarItems={() => (
            <HeaderSubmenuBarNavLink linkType="back" />
          )}
        />
      )}
      renderContent={() => <CsprNameExpirationsContent />}
      renderFooter={() => (
        <FooterButtonsContainer>
          <Button
            onClick={() =>
              window.open(CSPR_NAME_URL, '_blank', 'noopener,noreferrer')
            }
          >
            <Trans t={t}>Renew on CSPR.name</Trans>
          </Button>
        </FooterButtonsContainer>
      )}
    />
  );
};
