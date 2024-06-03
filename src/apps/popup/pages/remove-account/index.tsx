import React, { useCallback } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';

import { RouterPath, useTypedNavigate } from '@popup/router';

import { dispatchToMainStore } from '@background/redux/utils';
import { accountRemoved } from '@background/redux/vault/actions';

import {
  FooterButtonsContainer,
  HeaderPopup,
  HeaderSubmenuBarNavLink,
  PopupLayout
} from '@libs/layout';
import { Button } from '@libs/ui/components';

import { RemoveAccountPageContent } from './content';

export const RemoveAccountPage = () => {
  const { t } = useTranslation();
  const navigate = useTypedNavigate();
  const { accountName } = useParams();

  const handleRemoveAccount = useCallback(() => {
    if (!accountName) {
      navigate(RouterPath.Home);
      return;
    }

    dispatchToMainStore(accountRemoved({ accountName }));
    navigate(RouterPath.Home);
  }, [navigate, accountName]);

  if (!accountName) {
    navigate(RouterPath.Home);
    return null;
  }

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
      renderContent={() => <RemoveAccountPageContent />}
      renderFooter={() => (
        <FooterButtonsContainer>
          <Button color="primaryRed" onClick={handleRemoveAccount}>
            <Trans t={t}>Remove</Trans>
          </Button>
          <Button onClick={() => navigate(-1)} color="secondaryBlue">
            <Trans t={t}>Cancel</Trans>
          </Button>
        </FooterButtonsContainer>
      )}
    />
  );
};
