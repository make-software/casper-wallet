import React from 'react';

import {
  DeployIcon,
  NftTokenEntryPoint,
  NftTokenEntryPointNameMap
} from '@src/constants';

import { DefaultActionRows } from '@popup/pages/deploy-details/components/action-rows/default-action-rows';
import {
  AccountInfoRow,
  NftInfoRow,
  SimpleContainer
} from '@popup/pages/deploy-details/components/common';

interface NftActionsRowsProps {
  entryPointName: string;
  nftId: string;
  publicKey: string;
  newOwnerPublicKey?: string;
}

export const NftActionsRows = ({
  entryPointName,
  nftId,
  publicKey,
  newOwnerPublicKey
}: NftActionsRowsProps) => {
  const isBurn = entryPointName === NftTokenEntryPoint.burn;
  const isMint = entryPointName === NftTokenEntryPoint.mint;
  const isTransfer = entryPointName === NftTokenEntryPoint.transfer;
  const isUpdate = entryPointName === NftTokenEntryPoint.update_token_meta;
  const isApprove =
    entryPointName === NftTokenEntryPoint.approve ||
    entryPointName === NftTokenEntryPoint.set_approval_for_all;

  if (isBurn) {
    return (
      <SimpleContainer
        entryPointName={NftTokenEntryPointNameMap[entryPointName]}
      >
        <NftInfoRow
          contractLink="https://example.com"
          contractName={'CSPR.studio'}
          nftId={nftId}
          contractIcon={DeployIcon.CSPRStudio}
        />
        <AccountInfoRow publicKey={publicKey} label="owned by" />
      </SimpleContainer>
    );
  }

  if (isMint) {
    return (
      <SimpleContainer
        entryPointName={NftTokenEntryPointNameMap[entryPointName]}
      >
        <NftInfoRow
          contractLink="https://example.com"
          contractName={'CSPR.studio'}
          nftId={nftId}
          contractIcon={DeployIcon.CSPRStudio}
        />
        <AccountInfoRow publicKey={publicKey} label="to" />
      </SimpleContainer>
    );
  }

  if (isTransfer) {
    return (
      <SimpleContainer
        entryPointName={NftTokenEntryPointNameMap[entryPointName]}
      >
        <NftInfoRow
          contractLink="https://example.com"
          contractName={'CSPR.studio'}
          nftId={nftId}
          contractIcon={DeployIcon.CSPRStudio}
        />
        <AccountInfoRow publicKey={publicKey} label="from" />
        <AccountInfoRow publicKey={newOwnerPublicKey || ''} label="to" />
      </SimpleContainer>
    );
  }

  if (isUpdate) {
    return (
      <SimpleContainer
        entryPointName={NftTokenEntryPointNameMap[entryPointName]}
      >
        <NftInfoRow
          contractLink="https://example.com"
          contractName={'CSPR.studio'}
          nftId={nftId}
          contractIcon={DeployIcon.CSPRStudio}
        />
      </SimpleContainer>
    );
  }

  if (isApprove) {
    return (
      <SimpleContainer
        entryPointName={NftTokenEntryPointNameMap[entryPointName]}
      >
        <NftInfoRow
          contractLink="https://example.com"
          contractName={'CSPR.studio'}
          nftId={nftId}
          contractIcon={DeployIcon.CSPRStudio}
          label="of"
          manyNfts
        />
        <AccountInfoRow publicKey={publicKey} label="to" />
      </SimpleContainer>
    );
  }

  return (
    <DefaultActionRows
      entryPointName={entryPointName}
      contractLink="https://example.com"
      contractName="CSPR.studio"
      additionalInfo="CEP-47 NFT"
      iconUrl={DeployIcon.CSPRStudio}
    />
  );
};
