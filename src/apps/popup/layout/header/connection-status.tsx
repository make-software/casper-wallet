import React from 'react';
import styled from 'styled-components';

import { Typography, SvgIcon } from '@libs/ui';
import { useActiveTabOrigin } from '@src/hooks';
import { useSelector } from 'react-redux';
import { RootState } from 'typesafe-actions';
import { selectActiveAccountIsConnectedToOrigin } from '@popup/redux/vault/selectors';

const ConnectionStatusContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;

  width: fit-content;

  background-color: rgb(0, 0, 0, 0.16);
  padding: 4px 8px;
  border-radius: 100px;
`;

export function ConnectionStatus() {
  const origin = useActiveTabOrigin({ currentWindow: true });
  const isActiveAccountConnected = useSelector((state: RootState) =>
    selectActiveAccountIsConnectedToOrigin(state, origin)
  );

  return (
    <ConnectionStatusContainer>
      {isActiveAccountConnected && (
        <SvgIcon
          src="assets/icons/checkbox-checked.svg"
          size={16}
          color="contentGreen"
        />
      )}
      <Typography
        uppercase
        type="form-field-status"
        weight="semiBold"
        color="contentOnFill"
      >
        {isActiveAccountConnected ? 'Connected' : 'Disconnected'}
      </Typography>
    </ConnectionStatusContainer>
  );
}
