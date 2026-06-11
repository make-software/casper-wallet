import { IEIP712DisplayRow } from 'casper-wallet-core';
import React from 'react';
import styled from 'styled-components';

import { DeployIcon } from '@src/constants';

import { ContractInfoRow } from '@popup/pages/deploy-details/components/common';

import { AlignedFlexRow } from '@libs/layout';
import { Hash, HashVariant, Typography } from '@libs/ui/components';
import { AccountInfoRow } from '@libs/ui/components/account-info-row/account-info-row';

const RowDataContainer = styled(AlignedFlexRow)`
  margin: 16px;
  gap: 8px;
`;

interface Eip712DisplayRowProps {
  row: IEIP712DisplayRow;
}

export function Eip712DisplayRow({ row }: Eip712DisplayRowProps) {
  if (row.contractPackage) {
    return (
      <ContractInfoRow
        contractPackageHash={row.value}
        contractName={row.contractPackage.name}
        iconUrl={row.contractPackage.iconUrl}
        defaultSvg={DeployIcon.Cep18Default}
        label={row.label}
      />
    );
  }

  if (row.presentation === 'account') {
    return (
      <AccountInfoRow
        publicKey={row.value}
        label={row.label}
        csprName={row.accountInfo?.csprName}
        imgLogo={row.accountInfo?.brandingLogo}
        accountName={row.accountInfo?.name}
        accountLink={row.accountInfo?.explorerLink}
        isAction
        iconSize={20}
        withCopyIcon
      />
    );
  }

  return (
    <RowDataContainer>
      <Typography type="body" color="contentSecondary">
        {row.label}
      </Typography>
      {row.presentation === 'hash' ? (
        <Hash
          value={row.copyValue ?? row.value}
          variant={HashVariant.BodyHash}
          color="contentPrimary"
          truncated
          withCopyOnSelfClick
        />
      ) : (
        <Typography type="bodyHash" color="contentPrimary" overflowWrap>
          {row.displayValue}
        </Typography>
      )}
    </RowDataContainer>
  );
}
