import React from 'react';
import { useSelector } from 'react-redux';
import { Trans, useTranslation } from 'react-i18next';

import { PopoverLink, SvgIcon, Typography } from '@libs/ui';
import { RouterPath, useTypedNavigate } from '@popup/router';
// import { getBlockExplorerAccountUrl } from '@src/constants';
import { Popover } from '@libs/ui/components/popover/popover';
import {
  selectConnectedAccountNamesWithActiveOrigin,
  selectIsAnyAccountConnectedWithActiveOrigin
} from '@background/redux/vault/selectors';
import { selectActiveOrigin } from '@background/redux/active-origin/selectors';
import { useAccountManager } from '@popup/hooks/use-account-actions-with-events';
// import { selectApiConfigBasedOnActiveNetwork } from '@background/redux/settings/selectors';
import { Account } from '@background/redux/vault/types';
import { WindowApp } from '@background/create-open-window';
import { useWindowManager } from '@src/hooks';

interface AccountActionsMenuPopoverProps {
  account: Account;
}
export const AccountActionsMenuPopover = ({
  account
}: AccountActionsMenuPopoverProps) => {
  const navigate = useTypedNavigate();
  const { t } = useTranslation();
  const { disconnectAccountWithEvent: disconnectAccount } = useAccountManager();

  const activeOrigin = useSelector(selectActiveOrigin);
  const connectedAccountNames =
    useSelector(selectConnectedAccountNamesWithActiveOrigin) || [];
  // const { casperLiveUrl } = useSelector(selectApiConfigBasedOnActiveNetwork);
  const isAnyAccountConnected = useSelector(
    selectIsAnyAccountConnectedWithActiveOrigin
  );
  const { openWindow } = useWindowManager();

  return (
    <Popover
      renderMenuItems={({ closePopover }) => (
        <>
          {connectedAccountNames.includes(account.name) ? (
            <PopoverLink
              variant="contentAction"
              onClick={e => {
                closePopover(e);
                activeOrigin && disconnectAccount(account.name, activeOrigin);
              }}
            >
              <SvgIcon
                src="assets/icons/unlink.svg"
                marginRight="medium"
                color="contentDisabled"
              />
              <Typography type="body">
                <Trans t={t}>Disconnect</Trans>
              </Typography>
            </PopoverLink>
          ) : (
            <PopoverLink
              variant="contentAction"
              onClick={() =>
                navigate(
                  isAnyAccountConnected
                    ? `${RouterPath.ConnectAnotherAccount}/${account.name}`
                    : RouterPath.NoConnectedAccount
                )
              }
            >
              <SvgIcon
                src="assets/icons/link.svg"
                marginRight="medium"
                color="contentDisabled"
              />
              <Typography type="body">
                <Trans t={t}>Connect</Trans>
              </Typography>
            </PopoverLink>
          )}
          <PopoverLink
            variant="contentAction"
            onClick={() =>
              navigate(
                RouterPath.RenameAccount.replace(':accountName', account.name)
              )
            }
          >
            <SvgIcon
              src="assets/icons/edit.svg"
              marginRight="medium"
              color="contentDisabled"
            />
            <Typography type="body">
              <Trans t={t}>Rename</Trans>
            </Typography>
          </PopoverLink>
          <PopoverLink
            // target="_blank"
            variant="contentAction"
            title={t('View account in CSPR.live')}
            // href={getBlockExplorerAccountUrl(casperLiveUrl, account.publicKey)}
            onClick={() => {
              openWindow({
                windowApp: WindowApp.ImportAccount
              }).catch(e => console.error(e));
            }}
          >
            <SvgIcon
              src="assets/icons/external-link.svg"
              marginRight="medium"
              color="contentDisabled"
            />
            <Typography type="body">
              <Trans t={t}>View on CSPR.live</Trans>
            </Typography>
          </PopoverLink>
          <PopoverLink
            variant="contentAction"
            onClick={() =>
              navigate(
                RouterPath.AccountSettings.replace(':accountName', account.name)
              )
            }
          >
            <SvgIcon
              src="assets/icons/settings.svg"
              marginRight="medium"
              color="contentDisabled"
            />
            <Typography type="body">
              <Trans t={t}>Manage</Trans>
            </Typography>
          </PopoverLink>
        </>
      )}
    >
      <SvgIcon src="assets/icons/more.svg" />
    </Popover>
  );
};
