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

import { AlignedSpaceBetweenFlexRow } from '@libs/layout';
import { SvgIcon } from '@libs/ui/components';
import { AssociatedDeployRows } from '@libs/ui/components/deploy-plate/components/associated-deploy-rows';
import { AuctionDeployRows } from '@libs/ui/components/deploy-plate/components/auction-deploy-rows';
import { Cep18DeployRows } from '@libs/ui/components/deploy-plate/components/cep18-deploy-rows';
import { CSPRMarketDeployRows } from '@libs/ui/components/deploy-plate/components/cspr-market-deploy-rows';
import { DefaultDeployRows } from '@libs/ui/components/deploy-plate/components/default-deploy-rows';
import { NativeTransferDeployRows } from '@libs/ui/components/deploy-plate/components/native-transfer-deploy-rows';
import { NftDeployRows } from '@libs/ui/components/deploy-plate/components/nft-deploy-rows';

const Container = styled(AlignedSpaceBetweenFlexRow)`
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
        <SvgIcon src="assets/icons/chevron.svg" size={16} />
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
        }}
      >
        <DefaultDeployRows deploy={deploy} />
        <SvgIcon src="assets/icons/chevron.svg" size={16} />
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
        }}
      >
        <AuctionDeployRows deploy={deploy} />
        <SvgIcon src="assets/icons/chevron.svg" size={16} />
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
        }}
      >
        <AssociatedDeployRows deploy={deploy} />
        <SvgIcon src="assets/icons/chevron.svg" size={16} />
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
        }}
      >
        <CSPRMarketDeployRows deploy={deploy} />
        <SvgIcon src="assets/icons/chevron.svg" size={16} />
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
        }}
      >
        <Cep18DeployRows deploy={deploy} />
        <SvgIcon src="assets/icons/chevron.svg" size={16} />
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
        }}
      >
        <NftDeployRows deploy={deploy} />
        <SvgIcon src="assets/icons/chevron.svg" size={16} />
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
      }}
    >
      <DefaultDeployRows deploy={deploy} />
      <SvgIcon src="assets/icons/chevron.svg" size={16} />
    </Container>
  );
};
