import React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { RootState } from 'typesafe-actions';

import { getBlockExplorerAccountUrl } from '@src/constants';

import { RouterPath, useTypedNavigate } from '@popup/router';

import { selectApiConfigBasedOnActiveNetwork } from '@background/redux/settings/selectors';
import { selectVaultAccount } from '@background/redux/vault/selectors';

import {
  FooterButtonsContainer,
  HeaderPopup,
  HeaderSubmenuBarNavLink,
  PopupLayout
} from '@libs/layout';
import { Button, Link } from '@libs/ui/components';

import {
  AccountSettingsActionsGroup,
  AccountSettingsPageContent
} from './content';

export const AccountSettingsPage = () => {
  const navigate = useTypedNavigate();
  const { t } = useTranslation();

  const { accountName } = useParams();
  const account = useSelector((state: RootState) =>
    selectVaultAccount(state, accountName || '')
  );
  const { casperLiveUrl } = useSelector(selectApiConfigBasedOnActiveNetwork);

  if (!account) {
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
            as={props => (
              <Link
                color="contentAction"
                target="_blank"
                href={getBlockExplorerAccountUrl(
                  casperLiveUrl,
                  account.publicKey
                )}
                {...props}
              />
            )}
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
