import {
  AuctionEntryPointType,
  CEP18EntryPointType,
  CSPRMarketEntryPointType,
  ITxSignatureRequest,
  NFTEntryPointType,
  isTxSignatureRequestAssociatedKeysAction,
  isTxSignatureRequestAuctionAction,
  isTxSignatureRequestCasperMarketAction,
  isTxSignatureRequestCep18Action,
  isTxSignatureRequestNativeCsprAction,
  isTxSignatureRequestNftAction,
  isTxSignatureRequestUnknownContractAction,
  isTxSignatureRequestWasmAction,
  isTxSignatureRequestWasmProxyAction
} from 'casper-wallet-core';
import React, { PropsWithChildren } from 'react';
import styled from 'styled-components';

import { DeployActionEntryPointNameMap } from '@src/constants';

import { AssociatedActionRows } from '@popup/pages/deploy-details/components/action-rows/associated-action-rows';
import { AuctionActionRows } from '@popup/pages/deploy-details/components/action-rows/auction-action-rows';
import { Cep18ActionRows } from '@popup/pages/deploy-details/components/action-rows/cep18-action-rows';
import { CsprMarketActionRows } from '@popup/pages/deploy-details/components/action-rows/cspr-market-action-rows';
import { NativeTransferActionRows } from '@popup/pages/deploy-details/components/action-rows/native-transfer-action-rows';
import { NftActionsRows } from '@popup/pages/deploy-details/components/action-rows/nft-actions-rows';

import { UnknownContractActionRows } from '@signature-request/pages/sign-transaction/unknown-contract-action-rows';

import { AlignedSpaceBetweenFlexRow } from '@libs/layout';
import { Tile } from '@libs/ui/components';

const RowContainer = styled(AlignedSpaceBetweenFlexRow)`
  padding: 16px;
`;

interface SignatureRequestActionProps {
  signatureRequest: ITxSignatureRequest;
}

const Container: React.FC<PropsWithChildren> = ({ children }) => {
  return (
    <Tile style={{ marginTop: '16px' }}>
      <RowContainer>{children}</RowContainer>
    </Tile>
  );
};

export const getActionTitle = (signatureRequest: ITxSignatureRequest) => {
  const action = signatureRequest.action;

  if (isTxSignatureRequestNativeCsprAction(action)) {
    return 'Transfer';
  } else if (isTxSignatureRequestAssociatedKeysAction(action)) {
    return 'Update account';
  } else if (
    isTxSignatureRequestCep18Action(action) ||
    isTxSignatureRequestNftAction(action) ||
    isTxSignatureRequestCasperMarketAction(action) ||
    isTxSignatureRequestAuctionAction(action) ||
    isTxSignatureRequestUnknownContractAction(action) ||
    isTxSignatureRequestWasmProxyAction(action)
  ) {
    return (
      DeployActionEntryPointNameMap[action.entryPoint] ?? action.entryPoint
    );
  } else if (isTxSignatureRequestWasmAction(action)) {
    return 'WASM transaction';
  }

  return '';
};

export const SignatureRequestAction: React.FC<SignatureRequestActionProps> = ({
  signatureRequest
}) => {
  const title = getActionTitle(signatureRequest);
  const action = signatureRequest.action;

  if (isTxSignatureRequestNativeCsprAction(action)) {
    return (
      <Container>
        <NativeTransferActionRows
          title={title}
          {...action}
          isReceive={false}
          callerAccountInfo={signatureRequest.signingAccountInfo}
          callerPublicKey={signatureRequest.signingKey}
        />
      </Container>
    );
  }

  if (isTxSignatureRequestAuctionAction(action)) {
    return (
      <Container>
        <AuctionActionRows
          title={title}
          {...action}
          contractPackageHash={
            action.contractPackageHash ?? action.contractHash ?? ''
          }
          entryPoint={action.entryPoint.toLowerCase() as AuctionEntryPointType}
          contractLink={action.contractLink}
        />
      </Container>
    );
  }

  if (isTxSignatureRequestAssociatedKeysAction(action)) {
    return (
      <Container>
        <AssociatedActionRows
          contractPackageHash={
            action.contractPackageHash ?? action.contractHash ?? ''
          }
          contractName={action.contractName}
          publicKey={signatureRequest.signingKey}
          callerAccountInfo={signatureRequest.signingAccountInfo}
          contractLink={action.contractLink}
        />
      </Container>
    );
  }

  if (isTxSignatureRequestCasperMarketAction(action)) {
    return (
      <Container>
        <CsprMarketActionRows
          title={title}
          {...action}
          entryPoint={action.entryPoint as CSPRMarketEntryPointType}
          contractPackageHash={
            action.contractPackageHash ?? action.contractHash ?? ''
          }
          contractHash={action.contractHash ?? ''}
          contractLink={action.contractLink}
          collectionName={action.collectionName}
        />
      </Container>
    );
  }

  if (isTxSignatureRequestCep18Action(action)) {
    return (
      <Container>
        <Cep18ActionRows
          title={title}
          {...action}
          entryPoint={action.entryPoint as CEP18EntryPointType}
          contractPackageHash={
            action.contractPackageHash ?? action.contractHash ?? ''
          }
          contractLink={action.contractLink}
        />
      </Container>
    );
  }

  if (isTxSignatureRequestNftAction(action)) {
    return (
      <Container>
        <NftActionsRows
          callerPublicKey={signatureRequest.signingKey}
          callerAccountInfo={signatureRequest.signingAccountInfo}
          title={title}
          {...action}
          entryPoint={action.entryPoint as NFTEntryPointType}
          contractPackageHash={action.contractPackageHash ?? ''}
          contractHash={action.contractHash ?? ''}
          contractLink={action.contractLink}
          collectionName={action.collectionName}
        />
      </Container>
    );
  }

  if (
    isTxSignatureRequestUnknownContractAction(action) ||
    isTxSignatureRequestWasmProxyAction(action) ||
    isTxSignatureRequestWasmAction(action)
  ) {
    return (
      <Container>
        <UnknownContractActionRows title={title} action={action} />
      </Container>
    );
  }

  return null;
};
