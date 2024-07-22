import React from 'react';

import { DeployIcon, NftActivityTypeEnum } from '@src/constants';

import {
  AccountInfoRow,
  NftInfoRow,
  SimpleContainer
} from '@popup/pages/deploy-details/components/common';

import { NftCloudActionsResult } from '@libs/types/deploy';

const nftResultActionNameMap: { [key in number]: string } = {
  [NftActivityTypeEnum.Approve]: 'Granted transfer rights',
  [NftActivityTypeEnum.Burn]: 'Burned',
  [NftActivityTypeEnum.Mint]: 'Minted',
  [NftActivityTypeEnum.Transfer]: 'Transferred',
  [NftActivityTypeEnum.Metadata]: 'Updated metadata'
};

interface NftResultRowsProps {
  nftAction: NftCloudActionsResult;
}

export const NftResultRows = ({ nftAction }: NftResultRowsProps) => {
  const isBurn = nftAction.nft_action_id === NftActivityTypeEnum.Burn;
  const isMint = nftAction.nft_action_id === NftActivityTypeEnum.Mint;
  const isTransfer = nftAction.nft_action_id === NftActivityTypeEnum.Transfer;
  const isUpdate = nftAction.nft_action_id === NftActivityTypeEnum.Metadata;
  const isApprove = nftAction.nft_action_id === NftActivityTypeEnum.Approve;

  if (isBurn) {
    return (
      <SimpleContainer
        entryPointName={nftResultActionNameMap[nftAction.nft_action_id]}
      >
        <NftInfoRow
          contractLink="https://example.com"
          contractName="CSPR.studio"
          nftId={nftAction.token_id}
          contractIcon={DeployIcon.CSPRStudio}
        />
        <AccountInfoRow
          publicKey={
            '02028a04ab5ff8435f19581484643cadfd755ee9f0985e402d646ae6f3bd040912f5'
          }
          label="owned by"
        />
      </SimpleContainer>
    );
  }

  if (isMint) {
    return (
      <SimpleContainer
        entryPointName={nftResultActionNameMap[nftAction.nft_action_id]}
      >
        <NftInfoRow
          contractLink="https://example.com"
          contractName="CSPR.studio"
          nftId={nftAction.token_id}
          contractIcon={DeployIcon.CSPRStudio}
        />
        <AccountInfoRow
          publicKey={
            '02028a04ab5ff8435f19581484643cadfd755ee9f0985e402d646ae6f3bd040912f5'
          }
          label="to"
        />
      </SimpleContainer>
    );
  }

  if (isTransfer) {
    return (
      <SimpleContainer
        entryPointName={nftResultActionNameMap[nftAction.nft_action_id]}
      >
        <NftInfoRow
          contractLink="https://example.com"
          contractName="CSPR.studio"
          nftId={nftAction.token_id}
          contractIcon={DeployIcon.CSPRStudio}
        />
        <AccountInfoRow
          publicKey={
            '02028a04ab5ff8435f19581484643cadfd755ee9f0985e402d646ae6f3bd040912f5'
          }
          label="from"
        />
        <AccountInfoRow
          publicKey={
            '02028a04ab5ff8435f19581484643cadfd755ee9f0985e402d646ae6f3bd040912f5'
          }
          label="to"
        />
      </SimpleContainer>
    );
  }

  if (isUpdate) {
    return (
      <SimpleContainer
        entryPointName={nftResultActionNameMap[nftAction.nft_action_id]}
      >
        <NftInfoRow
          contractLink="https://example.com"
          contractName="CSPR.studio"
          nftId={nftAction.token_id}
          contractIcon={DeployIcon.CSPRStudio}
          label={'for'}
        />
      </SimpleContainer>
    );
  }

  if (isApprove) {
    return (
      <SimpleContainer
        entryPointName={nftResultActionNameMap[nftAction.nft_action_id]}
      >
        <NftInfoRow
          contractLink="https://example.com"
          contractName="CSPR.studio"
          nftId={nftAction.token_id}
          contractIcon={DeployIcon.CSPRStudio}
          label={'for'}
          manyNfts
        />
        <AccountInfoRow
          publicKey={
            '02028a04ab5ff8435f19581484643cadfd755ee9f0985e402d646ae6f3bd040912f5'
          }
          label="to"
        />
      </SimpleContainer>
    );
  }

  return null;
};
