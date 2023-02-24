import React from 'react';
import styled from 'styled-components';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { Typography, SvgIcon } from '@libs/ui';
import { AlignedFlexRow } from '@libs/layout';
import { selectCountOfConnectedAccounts } from '@src/background/redux/vault/selectors';

const ConnectionStatusContainer = styled(AlignedFlexRow)`
  width: fit-content;

  background-color: rgb(0, 0, 0, 0.16);
  padding: 4px 8px;
  border-radius: ${({ theme }) => theme.borderRadius.hundred}px;
`;

export function HeaderConnectionStatus() {
  const { t } = useTranslation();
  const countOfConnectedAccounts = useSelector(selectCountOfConnectedAccounts);

  return (
    <ConnectionStatusContainer gap="xs">
      {countOfConnectedAccounts > 0 && (
        <SvgIcon
          src="assets/icons/checkbox-checked.svg"
          size={16}
          color="contentGreen"
        />
      )}
      <Typography uppercase type="formFieldStatus" color="contentOnFill">
        {countOfConnectedAccounts > 0
          ? `${t('Connected')}: ${countOfConnectedAccounts}`
          : t('Disconnected')}
      </Typography>
    </ConnectionStatusContainer>
  );
}
