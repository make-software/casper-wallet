import { IAccountInfo } from 'casper-wallet-core/src/domain/accountInfo';
import {
  AuctionEntryPointType,
  IAuctionDeploy
} from 'casper-wallet-core/src/domain/deploys/entities';
import { Maybe } from 'casper-wallet-core/src/typings/common';
import React from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { AuctionDeployEntryPoint, DeployIcon } from '@src/constants';

import { getEntryPointName } from '@popup/pages/deploy-details/utils';

import { AlignedFlexRow, SpacingSize } from '@libs/layout';
import { Typography } from '@libs/ui/components';
import { AccountInfoIcon } from '@libs/ui/components/account-info-icon/account-info-icon';
import { AccountInfoRow } from '@libs/ui/components/account-info-row/account-info-row';
import { DeployContainer } from '@libs/ui/components/deploy-plate/components/deploy-container';

interface AuctionDeployRowsProps {
  deploy: IAuctionDeploy;
}

const ValidatorAccountInfo = ({
  publicKey,
  label,
  withHash,
  imgLogo,
  accountName,
  csprName
}: {
  publicKey: Maybe<string>;
  label: string;
  withHash?: boolean;
  imgLogo?: Maybe<string>;
  accountName?: string;
  csprName: Maybe<string> | undefined;
}) => {
  const { t } = useTranslation();

  if (withHash) {
    return (
      <AccountInfoRow
        publicKey={publicKey}
        accountName={accountName}
        imgLogo={imgLogo}
        label={label}
        csprName={csprName}
      />
    );
  }

  return (
    <>
      <Typography type="captionRegular" color="contentSecondary">
        <Trans t={t}>{label}</Trans>
      </Typography>
      <AccountInfoIcon
        publicKey={publicKey}
        iconUrl={imgLogo}
        accountName={accountName}
      />
    </>
  );
};

const ManageAuctionBidAction = ({ amount }: { amount: string }) => (
  <AlignedFlexRow gap={SpacingSize.Tiny}>
    <Typography type="captionHash">{amount}</Typography>
    <Typography type="captionHash" color="contentSecondary">
      CSPR
    </Typography>
  </AlignedFlexRow>
);

const DelegationAuctionAction = ({
  amount,
  entryPoint,
  toValidator,
  fromValidator,
  toValidatorAccountInfo,
  fromValidatorAccountInfo
}: {
  amount: string;
  entryPoint: AuctionEntryPointType;
  toValidator: Maybe<string>;
  fromValidator: Maybe<string>;
  toValidatorAccountInfo: Maybe<IAccountInfo>;
  fromValidatorAccountInfo: Maybe<IAccountInfo>;
}) => {
  const isDelegate = entryPoint === AuctionDeployEntryPoint.delegate;
  const isUndelegate = entryPoint === AuctionDeployEntryPoint.undelegate;
  const isRedelegate = entryPoint === AuctionDeployEntryPoint.redelegate;

  return (
    <>
      <AlignedFlexRow gap={SpacingSize.Tiny}>
        <Typography type="captionHash">{amount}</Typography>
        <Typography type="captionHash" color="contentSecondary">
          CSPR
        </Typography>
      </AlignedFlexRow>
      <AlignedFlexRow gap={SpacingSize.Small}>
        {(isDelegate || isUndelegate) && (
          <ValidatorAccountInfo
            label={isDelegate ? 'to' : 'from'}
            publicKey={isDelegate ? toValidator : fromValidator}
            withHash
            imgLogo={
              isDelegate
                ? toValidatorAccountInfo?.brandingLogo
                : fromValidatorAccountInfo?.brandingLogo
            }
            accountName={
              isDelegate
                ? toValidatorAccountInfo?.name
                : fromValidatorAccountInfo?.name
            }
            csprName={
              isDelegate
                ? toValidatorAccountInfo?.csprName
                : fromValidatorAccountInfo?.csprName
            }
          />
        )}
        {isRedelegate && (
          <>
            <ValidatorAccountInfo
              label="from"
              publicKey={fromValidator}
              imgLogo={fromValidatorAccountInfo?.brandingLogo}
              accountName={fromValidatorAccountInfo?.name}
              csprName={fromValidatorAccountInfo?.csprName}
            />
            <ValidatorAccountInfo
              label="to"
              publicKey={toValidator}
              imgLogo={toValidatorAccountInfo?.brandingLogo}
              accountName={toValidatorAccountInfo?.name}
              csprName={toValidatorAccountInfo?.csprName}
            />
          </>
        )}
      </AlignedFlexRow>
    </>
  );
};

export const AuctionDeployRows = ({ deploy }: AuctionDeployRowsProps) => {
  const { entryPoint, formattedDecimalAmount } = deploy;
  const isManageAuctionBidDeploy =
    entryPoint === AuctionDeployEntryPoint.activate ||
    entryPoint === AuctionDeployEntryPoint.withdraw ||
    entryPoint === AuctionDeployEntryPoint.add;

  const isDelegationDeploy =
    entryPoint === AuctionDeployEntryPoint.delegate ||
    entryPoint === AuctionDeployEntryPoint.undelegate ||
    entryPoint === AuctionDeployEntryPoint.redelegate;

  const title = getEntryPointName(deploy);

  if (isManageAuctionBidDeploy) {
    return (
      <DeployContainer
        timestamp={deploy.timestamp}
        iconUrl={DeployIcon.Auction}
        title={title}
        deployStatus={{
          status: deploy.status,
          errorMessage: deploy.errorMessage
        }}
      >
        <ManageAuctionBidAction amount={formattedDecimalAmount} />
      </DeployContainer>
    );
  }

  if (isDelegationDeploy) {
    return (
      <DeployContainer
        timestamp={deploy.timestamp}
        iconUrl={DeployIcon.Auction}
        title={title}
        deployStatus={{
          status: deploy.status,
          errorMessage: deploy.errorMessage
        }}
      >
        <DelegationAuctionAction
          amount={formattedDecimalAmount}
          entryPoint={entryPoint}
          toValidator={deploy.toValidator}
          fromValidator={deploy.fromValidator}
          toValidatorAccountInfo={deploy.toValidatorAccountInfo}
          fromValidatorAccountInfo={deploy.fromValidatorAccountInfo}
        />
      </DeployContainer>
    );
  }

  return null;
};
