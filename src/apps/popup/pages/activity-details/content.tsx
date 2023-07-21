import React, { useEffect, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import styled from 'styled-components';
import { useSelector } from 'react-redux';

import {
  AlignedFlexRow,
  AlignedSpaceBetweenFlexRow,
  BorderBottomPseudoElementProps,
  borderBottomPseudoElementRules,
  ContentContainer,
  FlexColumn,
  ParagraphContainer,
  RightAlignedFlexColumn,
  SpaceBetweenFlexRow,
  SpacingSize
} from '@libs/layout';
import {
  Avatar,
  DeployStatus,
  Hash,
  HashVariant,
  isPendingStatus,
  Link,
  SvgIcon,
  Tile,
  Tooltip,
  Typography
} from '@libs/ui';
import {
  dispatchFetchExtendedDeploysInfo,
  ExtendedDeploy
} from '@libs/services/account-activity-service';
import {
  divideErc20Balance,
  formatCurrency,
  formatNumber,
  formatTimestamp,
  formatTimestampAge,
  motesToCSPR,
  motesToCurrency
} from '@libs/ui/utils/formatters';
import { selectApiConfigBasedOnActiveNetwork } from '@background/redux/settings/selectors';
import {
  getBlockExplorerDeployUrl,
  TransferType,
  TypeName
} from '@src/constants';

interface ActivityDetailsPageContentProps {
  fromAccount?: string;
  toAccount?: string;
  deployHash?: string;
  type?: TransferType | null;
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

const ItemContainer = styled(AlignedSpaceBetweenFlexRow)`
  padding: 16px 16px 16px 0;
`;

const AddressContainer = styled(FlexColumn)`
  padding: 16px 12px 16px 0;
`;

const AmountContainer = styled(AlignedSpaceBetweenFlexRow)`
  padding: 8px 16px 8px 0;
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
  deployHash,
  type,
  amount,
  symbol
}: ActivityDetailsPageContentProps) => {
  const [deployInfo, setDeployInfo] = useState<ExtendedDeploy | null>(null);

  const { t } = useTranslation();
  const { casperLiveUrl } = useSelector(selectApiConfigBasedOnActiveNetwork);

  useEffect(() => {
    dispatchFetchExtendedDeploysInfo(deployHash || '').then(
      ({ payload: deployInfoResponse }) => {
        setDeployInfo(deployInfoResponse);
      }
    );
  }, [deployHash]);

  if (deployInfo == null) return null;

  const deployType: string = ExecutionTypesMap[deployInfo.executionTypeId];
  const decimals = deployInfo.contractPackage?.metadata?.decimals;

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
          {type && <Trans t={t}>{TypeName[type]}</Trans>}
        </Typography>
      </ParagraphContainer>
      <Tile>
        <RowsContainer marginLeftForSeparatorLine={16}>
          <ItemContainer>
            <DeployStatus textWithIcon deployResult={deployInfo} />
            <Link
              color="fillBlue"
              target="_blank"
              href={getBlockExplorerDeployUrl(
                casperLiveUrl,
                deployInfo.deployHash
              )}
            >
              <Typography type="captionMedium">
                <Trans t={t}>View on CSPR.live</Trans>
              </Typography>
            </Link>
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
                />
              </AlignedFlexRow>
              <SvgIcon src="assets/icons/ic-arrow-with-tail.svg" size={16} />
              <AlignedFlexRow gap={SpacingSize.Small}>
                <Avatar publicKey={toAccount || ''} size={24} />
                <Hash
                  value={toAccount || ''}
                  variant={HashVariant.CaptionHash}
                  truncated
                  truncatedSize="tiny"
                  color="contentPrimary"
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
            <Typography type="captionRegular">{deployType}</Typography>
          </ItemContainer>
          <AmountContainer>
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
