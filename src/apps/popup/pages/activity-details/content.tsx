import React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import {
  ActivityType,
  ActivityTypeName,
  AuctionManagerEntryPoint,
  getBlockExplorerContractUrl
} from '@src/constants';

import { selectApiConfigBasedOnActiveNetwork } from '@background/redux/settings/selectors';

import {
  AlignedFlexRow,
  AlignedSpaceBetweenFlexRow,
  BorderBottomPseudoElementProps,
  ContentContainer,
  FlexColumn,
  ParagraphContainer,
  RightAlignedFlexColumn,
  SpaceBetweenFlexRow,
  SpacingSize,
  borderBottomPseudoElementRules
} from '@libs/layout';
import { ExtendedDeploy } from '@libs/services/account-activity-service';
import {
  Avatar,
  ContractIcon,
  CopyToClipboard,
  DeployStatus,
  Hash,
  HashVariant,
  Link,
  SvgIcon,
  Tile,
  Tooltip,
  Typography,
  isPendingStatus
} from '@libs/ui';
import {
  divideErc20Balance,
  formatCurrency,
  formatNumber,
  formatTimestamp,
  formatTimestampAge,
  motesToCSPR,
  motesToCurrency
} from '@libs/ui/utils/formatters';

interface ActivityDetailsPageContentProps {
  fromAccount?: string;
  toAccount?: string;
  deployInfo?: ExtendedDeploy | null;
  type?: ActivityType | null;
  amount?: string | null;
  symbol?: string | null;
}

export const ExecutionTypesMap = {
  1: 'WASM deploy', //"ModuleBytes"
  2: 'Contract call', //"StoredContractByHash"
  3: 'Contract call', //"StoredContractByName",
  4: 'Contract call', //"StoredVersionedContractByHash",
  5: 'Contract call', //"StoredVersionedContractByName",
  6: 'Transfer'
};

const Erc20EventType = {
  erc20_approve: 'approve',
  erc20_transfer: 'transfer',
  erc20_transfer_from: 'transfer_from',
  erc20_mint: 'mint',
  erc20_burn: 'burn'
};

const ItemContainer = styled(AlignedSpaceBetweenFlexRow)`
  padding: 16px 16px 16px 0;
`;

const AddressContainer = styled(FlexColumn)`
  padding: 16px 12px 16px 0;
`;

const AmountContainer = styled(AlignedSpaceBetweenFlexRow)<{
  emptyAmount?: boolean;
}>`
  padding: ${({ emptyAmount }) =>
    emptyAmount ? '16px 16px 16px 0' : '8px 16px 8px 0'};
`;

const RowsContainer = styled(FlexColumn)<BorderBottomPseudoElementProps>`
  margin-top: 12px;

  & > *:not(:last-child) {
    ${borderBottomPseudoElementRules};
  }

  & > *:last-child {
    padding-left: ${({ marginLeftForSeparatorLine }) =>
      marginLeftForSeparatorLine}px;
  }
`;

export const ActivityDetailsPageContent = ({
  fromAccount,
  toAccount,
  deployInfo,
  type,
  amount,
  symbol
}: ActivityDetailsPageContentProps) => {
  const { t } = useTranslation();

  const { casperLiveUrl } = useSelector(selectApiConfigBasedOnActiveNetwork);

  if (deployInfo == null) return null;

  // TODO: update when activity will be added for NFT
  const EVENT_TYPE_LOCALE = {
    [Erc20EventType.erc20_transfer]: t('Transfer of'),
    [Erc20EventType.erc20_transfer_from]: t('Transfer from'),
    [Erc20EventType.erc20_approve]: t('Approve of'),
    [Erc20EventType.erc20_burn]: t('Burn of'),
    [Erc20EventType.erc20_mint]: t('Mint of'),
    [AuctionManagerEntryPoint.delegate]: t('Delegate with'),
    [AuctionManagerEntryPoint.undelegate]: t('Undelegate with'),
    [AuctionManagerEntryPoint.redelegate]: t('Redelegate with')
  };

  const decimals = deployInfo.contractPackage?.metadata?.decimals;
  const eventType = EVENT_TYPE_LOCALE[deployInfo.entryPoint?.name!];

  const transferAmount =
    deployInfo.amount != null
      ? Number.isInteger(decimals) && decimals !== undefined
        ? divideErc20Balance(deployInfo?.amount, decimals)
        : motesToCSPR(deployInfo.amount)
      : null;

  const formattedTransferAmount = transferAmount
    ? formatNumber(transferAmount, {
        precision: { min: 5 }
      })
    : '-';
  const transferAmountInUSD =
    deployInfo.amount != null &&
    deployInfo.rate &&
    formatCurrency(motesToCurrency(deployInfo.amount, deployInfo.rate), 'USD', {
      precision: 5
    });

  const paymentAmountInCSPR =
    deployInfo.paymentAmount != null &&
    formatNumber(motesToCSPR(deployInfo.paymentAmount), {
      precision: { min: 5 }
    });
  const paymentAmountInUSD =
    deployInfo.paymentAmount != null &&
    deployInfo.rate &&
    formatCurrency(
      motesToCurrency(deployInfo.paymentAmount, deployInfo.rate),
      'USD',
      {
        precision: 5
      }
    );

  const costAmountInCSPR = formatNumber(motesToCSPR(deployInfo.cost || '0'), {
    precision: { min: 5 }
  });
  const costAmountInUSD = formatCurrency(
    deployInfo.currencyCost || '0',
    'USD',
    {
      precision: 5
    }
  );

  return (
    <ContentContainer>
      <ParagraphContainer top={SpacingSize.XL}>
        <Typography type="header">
          {type && <Trans t={t}>{ActivityTypeName[type]}</Trans>}
        </Typography>
      </ParagraphContainer>
      <Tile>
        <RowsContainer marginLeftForSeparatorLine={16}>
          <ItemContainer>
            <DeployStatus textWithIcon deployResult={deployInfo} />
          </ItemContainer>
          <AddressContainer gap={SpacingSize.Small}>
            <SpaceBetweenFlexRow>
              <Typography type="listSubtext" color="contentSecondary">
                <Trans t={t}>From</Trans>
              </Typography>
              <Typography type="listSubtext" color="contentSecondary">
                <Trans t={t}>To</Trans>
              </Typography>
            </SpaceBetweenFlexRow>
            <AlignedSpaceBetweenFlexRow>
              <AlignedFlexRow gap={SpacingSize.Small}>
                <Avatar publicKey={fromAccount || ''} size={24} />
                <Hash
                  value={fromAccount || ''}
                  variant={HashVariant.CaptionHash}
                  truncated
                  truncatedSize="tiny"
                  color="contentPrimary"
                  placement="topRight"
                />
              </AlignedFlexRow>
              <SvgIcon src="assets/icons/ic-arrow-with-tail.svg" size={16} />
              <AlignedFlexRow gap={SpacingSize.Small}>
                <Avatar publicKey={toAccount || ''} size={24} />
                <Hash
                  value={toAccount || ''}
                  variant={HashVariant.CaptionHash}
                  truncated={toAccount !== 'N/A'}
                  truncatedSize="tiny"
                  color="contentPrimary"
                  placement="bottomLeft"
                />
              </AlignedFlexRow>
            </AlignedSpaceBetweenFlexRow>
          </AddressContainer>
          <ItemContainer>
            <Typography type="captionRegular" color="contentSecondary">
              <Trans t={t}>Deploy hash</Trans>
            </Typography>
            <Hash
              value={deployInfo.deployHash}
              variant={HashVariant.CaptionHash}
              truncated
              truncatedSize="tiny"
              color="contentPrimary"
              placement="bottomLeft"
            />
          </ItemContainer>
          <ItemContainer>
            <Typography type="captionRegular" color="contentSecondary">
              <Trans t={t}>Age</Trans>
            </Typography>
            <Tooltip
              title={formatTimestamp(deployInfo.timestamp)}
              placement="topLeft"
              noWrap
            >
              <Typography type="captionRegular">
                {formatTimestampAge(deployInfo.timestamp)}
              </Typography>
            </Tooltip>
          </ItemContainer>
          <ItemContainer>
            <Typography type="captionRegular" color="contentSecondary">
              <Trans t={t}>Action</Trans>
            </Typography>
            {deployInfo.contractPackage && eventType ? (
              <RightAlignedFlexColumn>
                <Typography type="captionRegular">{eventType}</Typography>
                <AlignedFlexRow gap={SpacingSize.Tiny}>
                  <ContractIcon
                    src={deployInfo.contractPackage?.icon_url}
                    contractTypeId={deployInfo.contractPackage.contract_type_id}
                  />
                  <Link
                    target="_blank"
                    color="contentAction"
                    href={getBlockExplorerContractUrl(
                      casperLiveUrl,
                      deployInfo.contractPackageHash!
                    )}
                  >
                    <Typography type="captionRegular">
                      {deployInfo.contractPackage.contract_name}
                    </Typography>
                  </Link>
                  <CopyToClipboard
                    renderContent={({ isClicked }) =>
                      isClicked ? (
                        <SvgIcon
                          src="assets/icons/tick-in-circle.svg"
                          size={16}
                          color="contentPositive"
                        />
                      ) : (
                        <SvgIcon src="assets/icons/copy.svg" size={16} />
                      )
                    }
                    valueToCopy={
                      deployInfo.contractPackage.contract_package_hash ||
                      deployInfo.contractHash!
                    }
                  />
                  <Typography type="captionRegular">
                    <Trans t={t}>
                      {deployInfo.contractPackage.contract_name === 'Auction'
                        ? 'System Contract'
                        : 'contract'}
                    </Trans>
                  </Typography>
                </AlignedFlexRow>
              </RightAlignedFlexColumn>
            ) : (
              <Typography type="captionRegular">
                {ExecutionTypesMap[deployInfo.executionTypeId]}
              </Typography>
            )}
          </ItemContainer>
          <AmountContainer emptyAmount={formattedTransferAmount === '-'}>
            <Typography type="captionRegular" color="contentSecondary">
              <Trans t={t}>Amount</Trans>
            </Typography>
            <RightAlignedFlexColumn>
              <Typography type="captionHash">
                {isPendingStatus(deployInfo.status)
                  ? `${amount} ${symbol || 'CSPR'}`
                  : `${formattedTransferAmount} ${
                      formattedTransferAmount !== '-'
                        ? deployInfo.contractPackage?.metadata?.symbol || 'CSPR'
                        : ''
                    }`}
              </Typography>
              {!deployInfo.contractPackage?.metadata?.symbol && (
                <Typography type="listSubtext" color="contentSecondary">
                  {transferAmountInUSD}
                </Typography>
              )}
            </RightAlignedFlexColumn>
          </AmountContainer>
          <AmountContainer>
            <Typography type="captionRegular" color="contentSecondary">
              <Trans t={t}>Payment Amount</Trans>
            </Typography>
            <RightAlignedFlexColumn>
              {isPendingStatus(deployInfo.status) ? (
                <Typography type="captionHash">
                  {`${paymentAmountInCSPR} CSPR`}
                </Typography>
              ) : (
                <>
                  <Typography type="captionHash">
                    {`${paymentAmountInCSPR} CSPR`}
                  </Typography>
                  <Typography type="listSubtext" color="contentSecondary">
                    {paymentAmountInUSD}
                  </Typography>
                </>
              )}
            </RightAlignedFlexColumn>
          </AmountContainer>
          <AmountContainer>
            <Typography type="captionRegular" color="contentSecondary">
              <Trans t={t}>Cost</Trans>
            </Typography>
            <RightAlignedFlexColumn>
              {isPendingStatus(deployInfo.status) ? (
                <Typography type="captionHash">-</Typography>
              ) : (
                <>
                  <Typography type="captionHash">
                    {`${costAmountInCSPR} CSPR`}
                  </Typography>
                  <Typography type="listSubtext" color="contentSecondary">
                    {costAmountInUSD}
                  </Typography>
                </>
              )}
            </RightAlignedFlexColumn>
          </AmountContainer>
        </RowsContainer>
      </Tile>
    </ContentContainer>
  );
};
