import React from 'react';
import styled from 'styled-components';

import { Typography, SvgIcon } from '@libs/ui';
import { useSelector } from 'react-redux';
import { selectCountOfConnectedAccounts } from '@src/background/redux/vault/selectors';
import { useTranslation } from 'react-i18next';

const ConnectionStatusContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;

  width: fit-content;

  background-color: rgb(0, 0, 0, 0.16);
  padding: 4px 8px;
  border-radius: 100px;
`;

export function HeaderConnectionStatus() {
  const { t } = useTranslation();
  const countOfConnectedAccounts = useSelector(selectCountOfConnectedAccounts);

  return (
    <ConnectionStatusContainer>
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
