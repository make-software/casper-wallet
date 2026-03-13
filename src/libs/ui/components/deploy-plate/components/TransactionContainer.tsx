import { IDeploy } from 'casper-wallet-core';
import React, { FC, PropsWithChildren } from 'react';
import styled from 'styled-components';

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

const Footer = styled(AlignedFlexRow)`
  padding: 16px 16px 16px 0;
  border-top: ${({ theme }) => `1px solid ${theme.color.borderPrimary}`};
`;

const Content = styled(FlexColumn)`
  padding: 16px 0;
`;

interface ITransactionContainerProps {
  deploy: IDeploy;
  onClick?: () => void;
}

export const TransactionContainer: FC<
  ITransactionContainerProps & PropsWithChildren
> = ({ deploy, children, onClick }) => {
  const resultsCount =
    (deploy.transfersActionsResult?.length ?? 0) +
    (deploy.nftActionsResult?.length ?? 0) +
    (deploy.cep18ActionsResult?.length ?? 0);

  return (
    <Container onClick={onClick}>
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
      <Content>{children}</Content>
      {resultsCount > 0 && (
        <Footer>
          <Typography type="captionRegular" color="contentAction" noWrap>
            {`View ${resultsCount} result${resultsCount > 1 ? 's' : ''}`}
          </Typography>
        </Footer>
      )}
    </Container>
  );
};
