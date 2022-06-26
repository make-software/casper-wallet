import React from 'react';
import styled from 'styled-components';

import { Typography, SvgIcon } from '@libs/ui';

const ConnectionStatusContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;

  width: fit-content;

  background-color: rgb(0, 0, 0, 0.16);
  padding: 4px 8px;
  border-radius: 100px;
`;

interface ConnectionStatusProps {
  isConnected: boolean;
}

export function ConnectionStatus({ isConnected }: ConnectionStatusProps) {
  return (
    <ConnectionStatusContainer>
      {isConnected && (
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
        {isConnected ? 'Connected' : 'Disconnected'}
      </Typography>
    </ConnectionStatusContainer>
  );
}
