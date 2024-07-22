import React from 'react';

import {
  AuctionEntryPointNameMap,
  AuctionManagerEntryPoint_V2,
  DeployIcon
} from '@src/constants';

import { DefaultActionRows } from '@popup/pages/deploy-details/components/action-rows/default-action-rows';
import {
  AccountInfoRow,
  ActionContainerWithLink,
  AmountRow,
  ContainerWithAmount
} from '@popup/pages/deploy-details/components/common';

const ManageAuctionBidAction = ({
  amount,
  entryPointName,
  contractLink,
  fiatAmount
}: {
  amount: string;
  entryPointName: AuctionManagerEntryPoint_V2;
  contractLink: string;
  fiatAmount: string;
}) => (
  <ActionContainerWithLink
    entryPointName={AuctionEntryPointNameMap[entryPointName]}
    contractLink={contractLink}
    contractName={'Auction bid'}
    contractIcon={DeployIcon.Auction}
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
  entryPointName,
  fiatAmount,
  validatorPublicKey,
  newValidatorPublicKey
}: {
  amount: string;
  entryPointName: AuctionManagerEntryPoint_V2;
  fiatAmount: string;
  validatorPublicKey: string;
  newValidatorPublicKey: string;
}) => {
  const isDelegate = entryPointName === AuctionManagerEntryPoint_V2.delegate;
  const isUndelegate =
    entryPointName === AuctionManagerEntryPoint_V2.undelegate;
  const isRedelegate =
    entryPointName === AuctionManagerEntryPoint_V2.redelegate;

  return (
    <ContainerWithAmount
      entryPointName={AuctionEntryPointNameMap[entryPointName]}
      amount={amount}
      fiatAmount={fiatAmount}
    >
      {isDelegate && (
        <AccountInfoRow publicKey={validatorPublicKey} label="to" />
      )}
      {(isUndelegate || isRedelegate) && (
        <>
          <AccountInfoRow publicKey={validatorPublicKey} label="from" />
          <AccountInfoRow publicKey={newValidatorPublicKey} label="to" />
        </>
      )}
    </ContainerWithAmount>
  );
};

interface AuctionActionRowsProps {
  validatorPublicKey: string;
  newValidatorPublicKey: string;
  amount: string;
  entryPointName: AuctionManagerEntryPoint_V2 | string;
  contractLink: string;
  contractName: string;
  fiatAmount: string;
}

export const AuctionActionRows = ({
  entryPointName,
  amount,
  contractLink,
  fiatAmount,
  newValidatorPublicKey,
  validatorPublicKey,
  contractName
}: AuctionActionRowsProps) => {
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
      <ManageAuctionBidAction
        amount={amount}
        entryPointName={entryPointName}
        contractLink={contractLink}
        fiatAmount={fiatAmount}
      />
    );
  }

  if (isDelegationDeploy) {
    return (
      <DelegationAuctionAction
        amount={amount}
        entryPointName={entryPointName}
        fiatAmount={fiatAmount}
        newValidatorPublicKey={newValidatorPublicKey}
        validatorPublicKey={validatorPublicKey}
      />
    );
  }

  return (
    <DefaultActionRows
      entryPointName={entryPointName}
      contractLink={contractLink}
      contractName={contractName}
      iconUrl={DeployIcon.Auction}
    />
  );
};
