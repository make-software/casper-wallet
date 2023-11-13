import React from 'react';
import styled from 'styled-components';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { AccountList, Modal, SvgIcon, Typography } from '@libs/ui';
import { AlignedFlexRow, SpacingSize } from '@libs/layout';
import { selectCountOfConnectedAccountsWithActiveOrigin } from '@src/background/redux/vault/selectors';

const ConnectionStatusContainer = styled(AlignedFlexRow)`
  width: fit-content;

  background-color: rgb(0, 0, 0, 0.16);
  padding: 4px 8px;
  border-radius: ${({ theme }) => theme.borderRadius.hundred}px;
`;

export function HeaderConnectionStatus() {
  const { t } = useTranslation();
  const countOfConnectedAccounts = useSelector(
    selectCountOfConnectedAccountsWithActiveOrigin
  );

  return (
    <Modal
      dataTestId="connection-status-modal"
      renderContent={({ closeModal }) => (
        <AccountList closeModal={closeModal} />
      )}
      children={({ isOpen }) => (
        <ConnectionStatusContainer gap={SpacingSize.Tiny}>
          <Typography uppercase type="formFieldStatus" color="contentOnFill">
            {countOfConnectedAccounts > 0
              ? `${countOfConnectedAccounts} ${t('Connected')}`
              : t('Disconnected')}
          </Typography>
          <SvgIcon
            size={16}
            src="assets/icons/chevron-up.svg"
            flipByAxis={isOpen ? undefined : 'X'}
            color="contentOnFill"
          />
        </ConnectionStatusContainer>
      )}
    />
  );
}
