import {
  IDeploy,
  isAssociatedKeysDeploy,
  isAuctionDeploy,
  isCasperMarketDeploy,
  isCep18Deploy,
  isNativeCsprDeploy,
  isNftDeploy
} from 'casper-wallet-core';
import React from 'react';

import { RouterPath, useTypedNavigate } from '@popup/router';

import { AssociatedDeployRows } from '@libs/ui/components/deploy-plate/components/associated-deploy-rows';
import { AuctionDeployRows } from '@libs/ui/components/deploy-plate/components/auction-deploy-rows';
import { Cep18DeployRows } from '@libs/ui/components/deploy-plate/components/cep18-deploy-rows';
import { CSPRMarketDeployRows } from '@libs/ui/components/deploy-plate/components/cspr-market-deploy-rows';
import { DefaultDeployRows } from '@libs/ui/components/deploy-plate/components/default-deploy-rows';
import { NativeTransferDeployRows } from '@libs/ui/components/deploy-plate/components/native-transfer-deploy-rows';
import { NftDeployRows } from '@libs/ui/components/deploy-plate/components/nft-deploy-rows';

import { TransactionContainer } from './components/TransactionContainer';

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
      <TransactionContainer
        deploy={deploy}
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
      </TransactionContainer>
    );
  }

  if (isAuctionDeploy(deploy)) {
    return (
      <TransactionContainer
        deploy={deploy}
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
      </TransactionContainer>
    );
  }

  if (isAssociatedKeysDeploy(deploy)) {
    return (
      <TransactionContainer
        deploy={deploy}
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
      </TransactionContainer>
    );
  }

  if (isCasperMarketDeploy(deploy)) {
    return (
      <TransactionContainer
        deploy={deploy}
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
      </TransactionContainer>
    );
  }

  if (isCep18Deploy(deploy)) {
    return (
      <TransactionContainer
        deploy={deploy}
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
      </TransactionContainer>
    );
  }

  if (isNftDeploy(deploy)) {
    return (
      <TransactionContainer
        deploy={deploy}
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
      </TransactionContainer>
    );
  }

  return (
    <TransactionContainer
      deploy={deploy}
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
    </TransactionContainer>
  );
};
