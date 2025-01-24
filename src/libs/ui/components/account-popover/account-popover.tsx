import React, { useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { getBlockExplorerAccountUrl } from '@src/constants';

import { useAccountManager } from '@popup/hooks/use-account-actions-with-events';
import { RouterPath, useTypedNavigate } from '@popup/router';

import { selectActiveOrigin } from '@background/redux/active-origin/selectors';
import { selectApiConfigBasedOnActiveNetwork } from '@background/redux/settings/selectors';
import { dispatchToMainStore } from '@background/redux/utils';
import { hideAccountFromListChanged } from '@background/redux/vault/actions';
import {
  selectConnectedAccountNamesWithActiveOrigin,
  selectIsAnyAccountConnectedWithActiveOrigin
} from '@background/redux/vault/selectors';

import { FlexColumn } from '@libs/layout';
import { Account } from '@libs/types/account';
import { PopoverLink, SvgIcon, Typography } from '@libs/ui/components';
import { Popover } from '@libs/ui/components/popover/popover';

const PopoverItemsContainer = styled(FlexColumn)`
  padding: 8px;

  background: ${({ theme }) => theme.color.backgroundPrimary};
  box-shadow: ${({ theme }) => theme.shadow.contextMenu};
  border-radius: ${({ theme }) => theme.borderRadius.eight}px;
`;

interface AccountActionsMenuPopoverProps {
  account: Account;
  onClick?: (e: React.MouseEvent) => void;
  showHideAccountItem?: boolean;
  popoverParentRef: React.MutableRefObject<HTMLDivElement | null>;
  isAllAccountsPage?: boolean;
}
export const AccountActionsMenuPopover = ({
  account,
  onClick,
  showHideAccountItem,
  popoverParentRef,
  isAllAccountsPage = false
}: AccountActionsMenuPopoverProps) => {
  const [isOpen, setIsOpen] = useState(false);

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
      popoverParentRef={popoverParentRef}
      isAllAccountsPage={isAllAccountsPage}
      isOpen={isOpen}
      setIsOpen={setIsOpen}
      content={() => (
        <PopoverItemsContainer>
          {connectedAccountNames.includes(account.name) ? (
            <PopoverLink
              variant="contentAction"
              onClick={event => {
                setIsOpen(false);
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
              <Typography type="body" color="contentPrimary">
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
              <Typography type="body" color="contentPrimary">
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
            <Typography type="body" color="contentPrimary">
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
            <Typography type="body" color="contentPrimary">
              <Trans t={t}>View on CSPR.live</Trans>
            </Typography>
          </PopoverLink>
          {showHideAccountItem && (
            <PopoverLink
              variant="contentAction"
              onClick={() => {
                dispatchToMainStore(
                  hideAccountFromListChanged({ accountName: account.name })
                );
              }}
            >
              <SvgIcon
                src={
                  account.hidden
                    ? 'assets/icons/show.svg'
                    : 'assets/icons/hide.svg'
                }
                marginRight="medium"
                color="contentDisabled"
              />
              <Typography type="body" color="contentPrimary">
                {account.hidden ? (
                  <Trans t={t}>Show in list</Trans>
                ) : (
                  <Trans t={t}>Hide from list</Trans>
                )}
              </Typography>
            </PopoverLink>
          )}
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
            <Typography type="body" color="contentPrimary">
              <Trans t={t}>Manage</Trans>
            </Typography>
          </PopoverLink>
        </PopoverItemsContainer>
      )}
    >
      <SvgIcon
        src="assets/icons/more.svg"
        data-testid="popover-children-container"
        onClick={() => setIsOpen(!isOpen)}
      />
    </Popover>
  );
};
