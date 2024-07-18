import React from 'react';
import { Trans, useTranslation } from 'react-i18next';

import {
  AuctionEntryPointNameMap,
  AuctionManagerEntryPoint_V2,
  DeployIcon
} from '@src/constants';

import { AlignedFlexRow, SpacingSize } from '@libs/layout';
import { Avatar, Hash, HashVariant, Typography } from '@libs/ui/components';
import { DeployContainer } from '@libs/ui/components/deploy-plate/components/deploy-container';
import { DeployDefault } from '@libs/ui/components/deploy-plate/components/deploy-default';

interface AuctionDeployRowsProps {
  validatorPublicKey: string;
  newValidatorPublicKey: string;
  amount: string;
  entryPointName: AuctionManagerEntryPoint_V2 | string;
  contractLink: string;
  contractName: string;
  timestamp: string;
}

const RenderLabel = ({ label }: { label: string }) => {
  const { t } = useTranslation();

  return (
    <Typography type="captionRegular" color="contentSecondary">
      <Trans t={t}>{label}</Trans>
    </Typography>
  );
};

const ValidatorAccountInfo = ({
  publicKey,
  label,
  withHash
}: {
  publicKey: string;
  label: string;
  withHash?: boolean;
}) => {
  if (withHash) {
    return (
      <>
        <RenderLabel label={label} />
        <AlignedFlexRow gap={SpacingSize.Tiny}>
          <Avatar publicKey={publicKey} size={16} />
          <Hash
            value={publicKey}
            variant={HashVariant.CaptionHash}
            truncated
            truncatedSize="small"
            color="contentPrimary"
          />
        </AlignedFlexRow>
      </>
    );
  }

  return (
    <>
      <RenderLabel label={label} />
      <Avatar publicKey={publicKey} size={16} />
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
  entryPointName,
  validatorPublicKey,
  newValidatorPublicKey
}: {
  amount: string;
  entryPointName: AuctionManagerEntryPoint_V2;
  validatorPublicKey: string;
  newValidatorPublicKey: string;
}) => {
  const isDelegate = entryPointName === AuctionManagerEntryPoint_V2.delegate;
  const isUndelegate =
    entryPointName === AuctionManagerEntryPoint_V2.undelegate;
  const isRedelegate =
    entryPointName === AuctionManagerEntryPoint_V2.redelegate;

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
            publicKey={validatorPublicKey}
            withHash
          />
        )}
        {isRedelegate && (
          <>
            <ValidatorAccountInfo label="from" publicKey={validatorPublicKey} />
            <ValidatorAccountInfo
              label="to"
              publicKey={newValidatorPublicKey}
            />
          </>
        )}
      </AlignedFlexRow>
    </>
  );
};

export const AuctionDeployRows = ({
  validatorPublicKey,
  newValidatorPublicKey,
  amount,
  entryPointName,
  contractLink,
  timestamp
}: AuctionDeployRowsProps) => {
  const isManageAuctionBidDeploy =
    entryPointName === AuctionManagerEntryPoint_V2.activate ||
    entryPointName === AuctionManagerEntryPoint_V2.withdraw ||
    entryPointName === AuctionManagerEntryPoint_V2.add;

  const isDelegationDeploy =
    entryPointName === AuctionManagerEntryPoint_V2.delegate ||
    entryPointName === AuctionManagerEntryPoint_V2.undelegate ||
    entryPointName === AuctionManagerEntryPoint_V2.redelegate;

  if (isManageAuctionBidDeploy) {
    return (
      <DeployContainer
        timestamp="2024-07-03T08:31:23.577Z"
        // TODO: add logic for generic icon and title
        iconUrl={DeployIcon.Auction}
        title={AuctionEntryPointNameMap[entryPointName]}
      >
        <ManageAuctionBidAction amount={amount} />
      </DeployContainer>
    );
  }

  if (isDelegationDeploy) {
    return (
      <DeployContainer
        timestamp={timestamp}
        iconUrl={DeployIcon.Auction}
        title={AuctionEntryPointNameMap[entryPointName]}
      >
        <DelegationAuctionAction
          amount={amount}
          entryPointName={entryPointName}
          validatorPublicKey={validatorPublicKey}
          newValidatorPublicKey={newValidatorPublicKey}
        />
      </DeployContainer>
    );
  }

  return (
    <DeployDefault
      contractLink={contractLink}
      contractName="name"
      entryPointName={entryPointName}
      timestamp={timestamp}
    />
  );
};
