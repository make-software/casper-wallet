import { IDeploy } from 'casper-wallet-core';
import {
  isCasperMarketDeploy,
  isNftDeploy
} from 'casper-wallet-core/src/utils/deploy';
import React, { FC, PropsWithChildren, useRef, useState } from 'react';
import styled from 'styled-components';

import { Cep18ResultRows } from '@popup/pages/deploy-details/components/result-rows/cep18-result-rows';
import { NativeTransferResultRows } from '@popup/pages/deploy-details/components/result-rows/native-transfer-result-rows';
import { NftResultRows } from '@popup/pages/deploy-details/components/result-rows/nft-result-rows';

import {
  AlignedFlexRow,
  AlignedSpaceBetweenFlexRow,
  FlexColumn,
  SpacingSize
} from '@libs/layout';
import { DeployStatus, Typography } from '@libs/ui/components';
import { AccountInfoIcon } from '@libs/ui/components/account-info-icon/account-info-icon';
import { formatTimestampAge } from '@libs/ui/utils';

const Container = styled(FlexColumn)`
  padding: 0 0 0 16px;
  background: ${props => props.theme.color.backgroundPrimary};
  border-radius: 12px;

  cursor: pointer;
`;

const Header = styled(AlignedSpaceBetweenFlexRow)`
  padding: 16px 16px 8px 0;
  border-bottom: ${({ theme }) => `1px solid ${theme.color.borderPrimary}`};
`;

const Footer = styled.button`
  display: flex;
  align-items: flex-start;
  width: 100%;
  padding: 16px 16px 16px 0;
  border: none;
  border-top: ${({ theme }) => `1px solid ${theme.color.borderPrimary}`};
  background: none;
  cursor: pointer;
`;

const Content = styled(FlexColumn)`
  padding: 16px 0;
`;

const ContentResults = styled(FlexColumn)`
  margin-right: 16px;
  gap: 8px;
  margin-top: 12px;
`;

const CollapsibleWrapper = styled.div<{
  $maxHeight: number;
  $isExpanded: boolean;
}>`
  overflow: hidden;
  transition: max-height 0.3s ease;
  max-height: ${({ $maxHeight, $isExpanded }) =>
    $isExpanded ? `${$maxHeight}px` : '0px'};
`;

const ContentResultItem = styled.div`
  border-radius: 4px;
  padding: 10px 16px;
  background: ${({ theme }) => `${theme.color.backgroundSecondary}`};
`;

interface ITransactionContainerProps {
  deploy: IDeploy;
  onClick?: () => void;
}

export const TransactionContainer: FC<
  ITransactionContainerProps & PropsWithChildren
> = ({ deploy, children, onClick }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const collapsibleRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const resultsCount =
    (deploy.transfersActionsResult?.length ?? 0) +
    (deploy.nftActionsResult?.length ?? 0) +
    (deploy.cep18ActionsResult?.length ?? 0);

  const transfers = deploy?.transfersActionsResult ?? [];
  const nfts = deploy.nftActionsResult ?? [];
  const cep18s = deploy.cep18ActionsResult ?? [];

  const firstSource =
    transfers.length > 0
      ? 'transfer'
      : nfts.length > 0
        ? 'nft'
        : cep18s.length > 0
          ? 'cep18'
          : null;

  const renderTransferItem = (
    action: (typeof transfers)[number],
    id: number
  ) => (
    <ContentResultItem key={`transfer-${id}`}>
      <NativeTransferResultRows
        amount={action.formattedDecimalAmount}
        callerAccountInfo={action.callerAccountInfo}
        recipientAccountInfo={action.recipientAccountInfo}
        toPublicKey={
          action.recipientKey || action.recipientAccountInfo?.accountHash!
        }
        fromPublicKey={
          action.callerPublicKey || action.callerAccountInfo?.accountHash!
        }
        fiatAmount={action.fiatAmount}
      />
    </ContentResultItem>
  );

  const renderNftItem = (action: (typeof nfts)[number], id: number) => {
    const contractPackageHash =
      isNftDeploy(deploy) || isCasperMarketDeploy(deploy)
        ? deploy?.collectionHash || deploy?.contractPackageHash
        : deploy?.contractPackageHash;

    return (
      <ContentResultItem key={`nft-${id}`}>
        <NftResultRows
          action={action}
          contractHash={deploy.contractHash}
          contractPackageHash={contractPackageHash}
          collectionHash={action.collectionHash}
        />
      </ContentResultItem>
    );
  };

  const renderCep18Item = (action: (typeof cep18s)[number], id: number) => (
    <ContentResultItem key={`cep18-${id}`}>
      <Cep18ResultRows
        action={action}
        contractPackageHash={deploy.contractPackageHash}
      />
    </ContentResultItem>
  );

  const remainingTransfers =
    firstSource === 'transfer' ? transfers.slice(1) : transfers;
  const remainingNfts = firstSource === 'nft' ? nfts.slice(1) : nfts;
  const remainingCep18s = firstSource === 'cep18' ? cep18s.slice(1) : cep18s;
  const remainingCount =
    remainingTransfers.length + remainingNfts.length + remainingCep18s.length;

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(prev => {
      if (prev) {
        setTimeout(() => {
          containerRef.current?.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest'
          });
        }, 300);
      }
      return !prev;
    });
  };

  return (
    <Container ref={containerRef} onClick={onClick} data-testid="deploy-plate">
      <Header>
        <AlignedFlexRow gap={SpacingSize.Medium}>
          <AccountInfoIcon
            publicKey={deploy.callerPublicKey}
            accountName={deploy.callerAccountInfo?.name}
            iconUrl={deploy.callerAccountInfo?.brandingLogo}
            size={20}
          />
          <Typography type="captionRegular" color="contentSecondary" noWrap>
            {formatTimestampAge(deploy.timestamp)}
          </Typography>
          <DeployStatus
            deployResult={{
              status: deploy.status,
              errorMessage: deploy.errorMessage
            }}
          />
        </AlignedFlexRow>
        <AlignedFlexRow gap={SpacingSize.Tiny}>
          <Typography type="captionHash" color="contentPrimary" noWrap>
            {deploy.formattedCost}
          </Typography>
          <Typography type="captionHash" color="contentSecondary" noWrap>
            CSPR
          </Typography>
        </AlignedFlexRow>
      </Header>
      <Content>
        {children}

        {resultsCount > 0 && (
          <ContentResults>
            {firstSource === 'transfer' && renderTransferItem(transfers[0], 0)}
            {firstSource === 'nft' && renderNftItem(nfts[0], 0)}
            {firstSource === 'cep18' && renderCep18Item(cep18s[0], 0)}

            {remainingCount > 0 && (
              <CollapsibleWrapper
                $isExpanded={isExpanded}
                $maxHeight={collapsibleRef.current?.scrollHeight ?? 0}
              >
                <FlexColumn ref={collapsibleRef} style={{ gap: 8 }}>
                  {remainingTransfers.map((action, id) =>
                    renderTransferItem(action, id + 1)
                  )}
                  {remainingNfts.map((action, id) =>
                    renderNftItem(action, firstSource === 'nft' ? id + 1 : id)
                  )}
                  {remainingCep18s.map((action, id) =>
                    renderCep18Item(
                      action,
                      firstSource === 'cep18' ? id + 1 : id
                    )
                  )}
                </FlexColumn>
              </CollapsibleWrapper>
            )}
          </ContentResults>
        )}
      </Content>
      {remainingCount > 0 && (
        <Footer onClick={handleToggle}>
          <Typography type="captionRegular" color="contentAction" noWrap>
            {isExpanded
              ? `Hide results`
              : `View ${resultsCount} result${resultsCount > 1 ? 's' : ''}`}
          </Typography>
        </Footer>
      )}
    </Container>
  );
};
