import {
  IEIP712DisplayRow,
  getCasperNetworkByChainName
} from 'casper-wallet-core';
import React from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import { DeployIcon } from '@src/constants';

import { ContractInfoRow } from '@popup/pages/deploy-details/components/common';

import { NetworkIconColor } from '@signature-request/pages/sign-transaction/signature-request-value';

import { AlignedFlexRow, SpaceBetweenFlexRow, SpacingSize } from '@libs/layout';
import { Hash, HashVariant, SvgIcon, Typography } from '@libs/ui/components';
import { AccountInfoRow } from '@libs/ui/components/account-info-row/account-info-row';
import { capitalizeString } from '@libs/ui/utils';

const RowDataContainer = styled(SpaceBetweenFlexRow)`
  margin: 16px;
  width: unset;
  gap: 8px;
`;

interface Eip712DisplayRowProps {
  row: IEIP712DisplayRow;
}

export function Eip712DisplayRow({ row }: Eip712DisplayRowProps) {
  if (row.contractPackage) {
    return (
      <RowDataContainer>
        <Typography type="body" color="contentSecondary">
          {row.label}
        </Typography>
        <ContractInfoRow
          contractPackageHash={row.value}
          contractName={row.contractPackage.name}
          iconUrl={row.contractPackage.iconUrl}
          defaultSvg={DeployIcon.Cep18Default}
        />
      </RowDataContainer>
    );
  }

  if (row.presentation === 'account') {
    return (
      <RowDataContainer>
        <Typography type="body" color="contentSecondary">
          {row.label}
        </Typography>
        <AccountInfoRow
          publicKey={row.value}
          csprName={row.accountInfo?.csprName}
          imgLogo={row.accountInfo?.brandingLogo}
          accountName={row.accountInfo?.name}
          accountLink={row.accountInfo?.explorerLink}
          isAction
          iconSize={20}
          withCopyIcon
          containerStyle={{ flexWrap: 'nowrap' }}
          nameContainerStyle={{ justifyContent: 'flex-end' }}
        />
      </RowDataContainer>
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

interface Eip712NetworkRowProps {
  chainName: string;
}

export function Eip712NetworkRow({ chainName }: Eip712NetworkRowProps) {
  const { t } = useTranslation();
  const network = getCasperNetworkByChainName(chainName);

  return (
    <RowDataContainer>
      <Typography type="body" color="contentSecondary">
        {t('Network')}
      </Typography>
      <AlignedFlexRow gap={SpacingSize.Small} style={{ width: 'unset' }}>
        {network && (
          <SvgIcon
            src="assets/icons/network.svg"
            size={20}
            color={NetworkIconColor[network]}
          />
        )}
        <Typography type="captionRegular" color="contentPrimary">
          {capitalizeString(network ?? chainName)}
        </Typography>
      </AlignedFlexRow>
    </RowDataContainer>
  );
}
