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

import { AccountInfoRow } from '@libs/ui/components/account-info-row/account-info-row';

const ManageAuctionBidAction = ({
  amount,
  title,
  fiatAmount,
  contractPackageHash,
  contractName,
  contractLink
}: {
  amount: string;
  title: string;
  fiatAmount: string;
  contractPackageHash: string;
  contractName: string;
  contractLink?: Maybe<string>;
}) => (
  <ActionContainerWithLink
    title={title}
    contractName={contractName}
    contractIcon={DeployIcon.Auction}
    contractPackageHash={contractPackageHash}
    contractLink={contractLink}
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
          accountLink={toValidatorAccountInfo?.explorerLink}
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
            accountLink={fromValidatorAccountInfo?.explorerLink}
          />
          <AccountInfoRow
            publicKey={toValidator}
            label="to"
            accountName={toValidatorAccountInfo?.name}
            imgLogo={toValidatorAccountInfo?.brandingLogo}
            isAction
            iconSize={20}
            csprName={toValidatorAccountInfo?.csprName}
            accountLink={toValidatorAccountInfo?.explorerLink}
          />
        </>
      )}
    </ContainerWithAmount>
  );
};

interface AuctionActionRowsProps {
  entryPoint: IAuctionDeploy['entryPoint'];
  formattedDecimalAmount: IAuctionDeploy['formattedDecimalAmount'];
  fiatAmount: IAuctionDeploy['fiatAmount'];
  fromValidator: IAuctionDeploy['fromValidator'];
  toValidator: IAuctionDeploy['toValidator'];
  fromValidatorAccountInfo: IAuctionDeploy['fromValidatorAccountInfo'];
  toValidatorAccountInfo: IAuctionDeploy['toValidatorAccountInfo'];
  contractName: IAuctionDeploy['contractName'];
  contractPackageHash: IAuctionDeploy['contractPackageHash'];
  title: string;
  contractLink?: Maybe<string>;
}

export const AuctionActionRows = ({
  entryPoint,
  formattedDecimalAmount,
  fiatAmount,
  fromValidator,
  toValidator,
  fromValidatorAccountInfo,
  toValidatorAccountInfo,
  contractPackageHash,
  contractName,
  title,
  contractLink
}: AuctionActionRowsProps) => {
  const isManageAuctionBidDeploy =
    entryPoint === AuctionDeployEntryPoint.activate ||
    entryPoint === AuctionDeployEntryPoint.withdraw ||
    entryPoint === AuctionDeployEntryPoint.add;

  const isDelegationDeploy =
    entryPoint === AuctionDeployEntryPoint.delegate ||
    entryPoint === AuctionDeployEntryPoint.undelegate ||
    entryPoint === AuctionDeployEntryPoint.redelegate;

  if (isManageAuctionBidDeploy) {
    return (
      <ManageAuctionBidAction
        amount={formattedDecimalAmount}
        title={title}
        fiatAmount={fiatAmount}
        contractName={contractName}
        contractPackageHash={contractPackageHash}
        contractLink={contractLink}
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
      contractPackageHash={contractPackageHash}
      contractName={contractName}
      contractLink={contractLink}
      iconUrl={DeployIcon.Auction}
    />
  );
};
