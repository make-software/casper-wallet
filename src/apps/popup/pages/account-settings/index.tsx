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
import { Button, Link } from '@libs/ui';
import { selectVaultAccountWithName } from '@background/redux/vault/selectors';
import { RouterPath, useTypedNavigate } from '@popup/router';
import { getBlockExplorerAccountUrl } from '@src/constants';
import { selectCasperUrlsBaseOnActiveNetworkSetting } from '@src/background/redux/settings/selectors';

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
  const { casperLiveUrl } = useSelector(
    selectCasperUrlsBaseOnActiveNetworkSetting
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
            as={props => (
              <Link
                color="fillBlue"
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
