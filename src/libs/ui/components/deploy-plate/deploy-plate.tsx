import { IDeploy } from 'casper-wallet-core';
import {
  isAssociatedKeysDeploy,
  isAuctionDeploy,
  isCasperMarketDeploy,
  isCep18Deploy,
  isNativeCsprDeploy,
  isNftDeploy,
  isWasmDeployExecutionType
} from 'casper-wallet-core/src/utils/deploy';
import React from 'react';
import styled from 'styled-components';

import { RouterPath, useTypedNavigate } from '@popup/router';

import { AlignedFlexRow } from '@libs/layout';
import { AssociatedDeployRows } from '@libs/ui/components/deploy-plate/components/associated-deploy-rows';
import { AuctionDeployRows } from '@libs/ui/components/deploy-plate/components/auction-deploy-rows';
import { Cep18DeployRows } from '@libs/ui/components/deploy-plate/components/cep18-deploy-rows';
import { CSPRMarketDeployRows } from '@libs/ui/components/deploy-plate/components/cspr-market-deploy-rows';
import { DefaultDeployRows } from '@libs/ui/components/deploy-plate/components/default-deploy-rows';
import { NativeTransferDeployRows } from '@libs/ui/components/deploy-plate/components/native-transfer-deploy-rows';
import { NftDeployRows } from '@libs/ui/components/deploy-plate/components/nft-deploy-rows';

const Container = styled(AlignedFlexRow)`
  padding: 16px 12px 16px;

  background: ${props => props.theme.color.backgroundPrimary};

  cursor: pointer;
`;

interface DeployPlateProps {
  deploy: IDeploy;
  onClick?: () => void;
  navigateHome?: boolean;
}

export const DeployPlate = ({
  deploy,
  onClick,
  navigateHome = false
}: DeployPlateProps) => {
  const navigate = useTypedNavigate();

  if (isNativeCsprDeploy(deploy)) {
    return (
      <Container
        onClick={() => {
          navigate(RouterPath.DeployDetails, {
            state: {
              deploy,
              navigateHome
            }
          });

          if (onClick) {
            onClick();
          }
        }}
      >
        <NativeTransferDeployRows deploy={deploy} />
      </Container>
    );
  }

  if (isWasmDeployExecutionType(deploy)) {
    return (
      <Container
        onClick={() => {
          navigate(RouterPath.DeployDetails, {
            state: {
              deploy,
              navigateHome
            }
          });

          if (onClick) {
            onClick();
          }
        }}
      >
        <DefaultDeployRows deploy={deploy} />
      </Container>
    );
  }

  if (isAuctionDeploy(deploy)) {
    return (
      <Container
        onClick={() => {
          navigate(RouterPath.DeployDetails, {
            state: {
              deploy,
              navigateHome
            }
          });

          if (onClick) {
            onClick();
          }
        }}
      >
        <AuctionDeployRows deploy={deploy} />
      </Container>
    );
  }

  if (isAssociatedKeysDeploy(deploy)) {
    return (
      <Container
        onClick={() => {
          navigate(RouterPath.DeployDetails, {
            state: {
              deploy,
              navigateHome
            }
          });

          if (onClick) {
            onClick();
          }
        }}
      >
        <AssociatedDeployRows deploy={deploy} />
      </Container>
    );
  }

  if (isCasperMarketDeploy(deploy)) {
    return (
      <Container
        onClick={() => {
          navigate(RouterPath.DeployDetails, {
            state: {
              deploy,
              navigateHome
            }
          });

          if (onClick) {
            onClick();
          }
        }}
      >
        <CSPRMarketDeployRows deploy={deploy} />
      </Container>
    );
  }

  if (isCep18Deploy(deploy)) {
    return (
      <Container
        onClick={() => {
          navigate(RouterPath.DeployDetails, {
            state: {
              deploy,
              navigateHome
            }
          });

          if (onClick) {
            onClick();
          }
        }}
      >
        <Cep18DeployRows deploy={deploy} />
      </Container>
    );
  }

  if (isNftDeploy(deploy)) {
    return (
      <Container
        onClick={() => {
          navigate(RouterPath.DeployDetails, {
            state: {
              deploy,
              navigateHome
            }
          });

          if (onClick) {
            onClick();
          }
        }}
      >
        <NftDeployRows deploy={deploy} />
      </Container>
    );
  }

  return (
    <Container
      onClick={() => {
        navigate(RouterPath.DeployDetails, {
          state: {
            deploy,
            navigateHome
          }
        });

        if (onClick) {
          onClick();
        }
      }}
    >
      <DefaultDeployRows deploy={deploy} />
    </Container>
  );
};
