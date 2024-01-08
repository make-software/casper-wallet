import React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';

import { getBlockExplorerAccountUrl } from '@src/constants';

import { useAccountManager } from '@popup/hooks/use-account-actions-with-events';
import { RouterPath, useTypedNavigate } from '@popup/router';

import { selectActiveOrigin } from '@background/redux/active-origin/selectors';
import { selectApiConfigBasedOnActiveNetwork } from '@background/redux/settings/selectors';
import {
  selectConnectedAccountNamesWithActiveOrigin,
  selectIsAnyAccountConnectedWithActiveOrigin
} from '@background/redux/vault/selectors';
import { Account } from '@background/redux/vault/types';

import { PopoverLink, SvgIcon, Typography } from '@libs/ui';
import { Popover } from '@libs/ui/components/popover/popover';

interface AccountActionsMenuPopoverProps {
  account: Account;
  onClick?: (e: React.MouseEvent) => void;
}
export const AccountActionsMenuPopover = ({
  account,
  onClick
}: AccountActionsMenuPopoverProps) => {
  const navigate = useTypedNavigate();
  const { t } = useTranslation();
  const { disconnectAccountWithEvent: disconnectAccount } = useAccountManager();

  const activeOrigin = useSelector(selectActiveOrigin);
  const connectedAccountNames =
    useSelector(selectConnectedAccountNamesWithActiveOrigin) || [];
  const { casperLiveUrl } = useSelector(selectApiConfigBasedOnActiveNetwork);
  const isAnyAccountConnected = useSelector(
    selectIsAnyAccountConnectedWithActiveOrigin
  );

  return (
    <Popover
      renderMenuItems={({ closePopover }) => (
        <>
          {connectedAccountNames.includes(account.name) ? (
            <PopoverLink
              variant="contentAction"
              onClick={event => {
                closePopover(event);
                activeOrigin && disconnectAccount(account.name, activeOrigin);

                if (onClick) {
                  onClick(event);
                }
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
              onClick={event => {
                navigate(
                  isAnyAccountConnected
                    ? `${RouterPath.ConnectAnotherAccount}/${account.name}`
                    : RouterPath.NoConnectedAccount
                );

                if (onClick) {
                  onClick(event);
                }
              }}
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
            onClick={event => {
              navigate(
                RouterPath.RenameAccount.replace(':accountName', account.name)
              );

              if (onClick) {
                onClick(event);
              }
            }}
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
            target="_blank"
            variant="contentAction"
            title={t('View account in CSPR.live')}
            href={getBlockExplorerAccountUrl(casperLiveUrl, account.publicKey)}
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
            onClick={event => {
              navigate(
                RouterPath.AccountSettings.replace(':accountName', account.name)
              );

              if (onClick) {
                onClick(event);
              }
            }}
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
