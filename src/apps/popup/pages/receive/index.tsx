import React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';

import { selectVaultActiveAccount } from '@background/redux/vault/selectors';

import { useCopyToClipboard } from '@hooks/use-copy-to-clipboard';

import {
  FooterButtonsContainer,
  HeaderSubmenuBarNavLink,
  PopupHeader,
  PopupLayout
} from '@libs/layout';
import { Button, Typography } from '@libs/ui';

import { ReceivePageContent } from './content';

export const ReceivePage = () => {
  const { t } = useTranslation();

  const activeAccount = useSelector(selectVaultActiveAccount);

  const { handleCopyOnClick, isClicked } = useCopyToClipboard(
    activeAccount?.publicKey || ''
  );

  return (
    <PopupLayout
      renderHeader={() => (
        <PopupHeader
          withNetworkSwitcher
          withMenu
          withConnectionStatus
          renderSubmenuBarItems={() => (
            <HeaderSubmenuBarNavLink linkType="back" />
          )}
        />
      )}
      renderContent={() => <ReceivePageContent />}
      renderFooter={() => (
        <FooterButtonsContainer>
          <Button color="secondaryBlue" onClick={handleCopyOnClick}>
            {isClicked ? (
              <Typography type="bodySemiBold" color="contentPositive">
                <Trans t={t}>Copied!</Trans>
              </Typography>
            ) : (
              <Trans t={t}>Copy public key</Trans>
            )}
          </Button>
        </FooterButtonsContainer>
      )}
    />
  );
};
