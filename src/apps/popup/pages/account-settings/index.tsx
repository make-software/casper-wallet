import React from 'react';
import { useParams } from 'react-router-dom';
import { RootState } from 'typesafe-actions';
import { Trans, useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';

import {
  FooterButtonsContainer,
  HeaderSubmenuBarNavLink,
  PopupHeader,
  PopupLayout
} from '@libs/layout';
import { Button } from '@libs/ui';
import { selectVaultAccountWithName } from '@background/redux/vault/selectors';
import { RouterPath, useTypedNavigate } from '@popup/router';
import { getBlockExplorerAccountUrl } from '@src/constants';

import {
  AccountSettingsActionsGroup,
  AccountSettingsPageContent
} from './content';

export const AccountSettingsPage = () => {
  const navigate = useTypedNavigate();
  const { t } = useTranslation();

  const { accountName } = useParams();
  const account = useSelector((state: RootState) =>
    selectVaultAccountWithName(state, accountName || '')
  );

  if (!account) {
    navigate(RouterPath.Home);
    return null;
  }

  return (
    <PopupLayout
      renderHeader={() => (
        <PopupHeader
          withLock
          withMenu
          withConnectionStatus
          renderSubmenuBarItems={() => (
            <>
              <HeaderSubmenuBarNavLink linkType="close" />
              <AccountSettingsActionsGroup />
            </>
          )}
        />
      )}
      renderContent={() => <AccountSettingsPageContent />}
      renderFooter={() => (
        <FooterButtonsContainer>
          <Button
            displayAsLinkTo={getBlockExplorerAccountUrl(account.publicKey)}
            color="secondaryBlue"
            title={t('View account in CSPR.live')}
          >
            <Trans t={t}>View on CSPR.live</Trans>
          </Button>
        </FooterButtonsContainer>
      )}
    />
  );
};
