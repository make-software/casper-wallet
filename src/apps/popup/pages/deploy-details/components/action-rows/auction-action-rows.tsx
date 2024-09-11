import { IAccountInfo } from 'casper-wallet-core/src/domain/accountInfo';
import { IAuctionDeploy } from 'casper-wallet-core/src/domain/deploys/entities';
import { Maybe } from 'casper-wallet-core/src/typings/common';
import React from 'react';

import { AuctionDeployEntryPoint, DeployIcon } from '@src/constants';

import { DefaultActionRows } from '@popup/pages/deploy-details/components/action-rows/default-action-rows';
import {
  ActionContainerWithLink,
  AmountRow,
  ContainerWithAmount
} from '@popup/pages/deploy-details/components/common';
import { getEntryPointName } from '@popup/pages/deploy-details/utils';

import { AccountInfoRow } from '@libs/ui/components/account-info-row/account-info-row';

const ManageAuctionBidAction = ({
  amount,
  title,
  fiatAmount,
  contractPackageHash,
  contractName
}: {
  amount: string;
  title: string;
  fiatAmount: string;
  contractPackageHash: string;
  contractName: string;
}) => (
  <ActionContainerWithLink
    title={title}
    contractName={contractName}
    contractIcon={DeployIcon.Auction}
    contractPackageHash={contractPackageHash}
  >
    <AmountRow
      amount={amount}
      fiatAmount={fiatAmount}
      symbol="CSPR"
      label="of"
    />
  </ActionContainerWithLink>
);

const DelegationAuctionAction = ({
  amount,
  title,
  fiatAmount,
  toValidatorAccountInfo,
  fromValidatorAccountInfo,
  entryPoint,
  toValidator,
  fromValidator
}: {
  amount: string;
  title: string;
  fiatAmount: string;
  toValidatorAccountInfo: Maybe<IAccountInfo>;
  fromValidatorAccountInfo: Maybe<IAccountInfo>;
  entryPoint: string;
  toValidator: Maybe<string>;
  fromValidator: Maybe<string>;
}) => {
  const isDelegate = entryPoint === AuctionDeployEntryPoint.delegate;
  const isUndelegate = entryPoint === AuctionDeployEntryPoint.undelegate;
  const isRedelegate = entryPoint === AuctionDeployEntryPoint.redelegate;

  return (
    <ContainerWithAmount title={title} amount={amount} fiatAmount={fiatAmount}>
      {isDelegate && (
        <AccountInfoRow
          publicKey={toValidator}
          label="to"
          accountName={toValidatorAccountInfo?.name}
          imgLogo={toValidatorAccountInfo?.brandingLogo}
          isAction
          iconSize={20}
          csprName={toValidatorAccountInfo?.csprName}
        />
      )}
      {(isUndelegate || isRedelegate) && (
        <>
          <AccountInfoRow
            publicKey={fromValidator}
            label="from"
            accountName={fromValidatorAccountInfo?.name}
            imgLogo={fromValidatorAccountInfo?.brandingLogo}
            isAction
            iconSize={20}
            csprName={fromValidatorAccountInfo?.csprName}
          />
          <AccountInfoRow
            publicKey={toValidator}
            label="to"
            accountName={toValidatorAccountInfo?.name}
            imgLogo={toValidatorAccountInfo?.brandingLogo}
            isAction
            iconSize={20}
            csprName={toValidatorAccountInfo?.csprName}
          />
        </>
      )}
    </ContainerWithAmount>
  );
};

interface AuctionActionRowsProps {
  deploy: IAuctionDeploy;
}

export const AuctionActionRows = ({ deploy }: AuctionActionRowsProps) => {
  const {
    entryPoint,
    formattedDecimalAmount,
    fiatAmount,
    fromValidator,
    toValidator,
    fromValidatorAccountInfo,
    toValidatorAccountInfo
  } = deploy;
  const isManageAuctionBidDeploy =
    entryPoint === AuctionDeployEntryPoint.activate ||
    entryPoint === AuctionDeployEntryPoint.withdraw ||
    entryPoint === AuctionDeployEntryPoint.add;

  const isDelegationDeploy =
    entryPoint === AuctionDeployEntryPoint.delegate ||
    entryPoint === AuctionDeployEntryPoint.undelegate ||
    entryPoint === AuctionDeployEntryPoint.redelegate;

  const title = getEntryPointName(deploy, true);

  if (isManageAuctionBidDeploy) {
    return (
      <ManageAuctionBidAction
        amount={formattedDecimalAmount}
        title={title}
        fiatAmount={fiatAmount}
        contractName={deploy.contractName}
        contractPackageHash={deploy.contractPackageHash}
      />
    );
  }

  if (isDelegationDeploy) {
    return (
      <DelegationAuctionAction
        amount={formattedDecimalAmount}
        title={title}
        fiatAmount={fiatAmount}
        fromValidatorAccountInfo={fromValidatorAccountInfo}
        toValidatorAccountInfo={toValidatorAccountInfo}
        entryPoint={entryPoint}
        fromValidator={fromValidator}
        toValidator={toValidator}
      />
    );
  }

  return (
    <DefaultActionRows
      title={title}
      contractPackageHash={deploy.contractPackageHash}
      contractName={deploy.contractName}
      iconUrl={DeployIcon.Auction}
    />
  );
};
