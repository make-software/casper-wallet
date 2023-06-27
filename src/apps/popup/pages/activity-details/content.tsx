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
  Link,
  SvgIcon,
  Tile,
  Tooltip,
  TransferType,
  TypeName,
  Typography
} from '@libs/ui';
import {
  dispatchFetchExtendedDeploysInfo,
  ExtendedDeployResult
} from '@libs/services/account-activity-service';
import {
  formatCurrency,
  formatNumber,
  formatTimestamp,
  formatTimestampAge,
  motesToCSPR,
  motesToCurrency
} from '@libs/ui/utils/formatters';
import { selectApiConfigBasedOnActiveNetwork } from '@background/redux/settings/selectors';
import { getBlockExplorerDeployUrl } from '@src/constants';

interface ActivityDetailsPageContentProps {
  fromAccountPublicKey?: string;
  toAccountPublicKey?: string;
  deployHash?: string;
  type?: TransferType | null;
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
  fromAccountPublicKey,
  toAccountPublicKey,
  deployHash,
  type
}: ActivityDetailsPageContentProps) => {
  const [deployInfo, setDeployInfo] = useState<ExtendedDeployResult | null>(
    null
  );

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

  const deployType: string = ExecutionTypesMap[deployInfo.execution_type_id];

  const transferAmountInCSPR =
    deployInfo.amount != null
      ? formatNumber(motesToCSPR(deployInfo.amount), {
          precision: { min: 5, max: 5 }
        })
      : '-';
  const transferAmountInUSD =
    deployInfo.amount != null &&
    formatCurrency(motesToCurrency(deployInfo.amount, deployInfo.rate), 'USD', {
      precision: 5
    });
  const costAmountInCSPR = formatNumber(motesToCSPR(deployInfo.cost), {
    precision: { min: 5, max: 5 }
  });
  const costAmountInUSD = formatCurrency(deployInfo.currency_cost, 'USD', {
    precision: 5
  });

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
                deployInfo.deploy_hash
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
                <Avatar publicKey={fromAccountPublicKey || ''} size={24} />
                <Hash
                  value={fromAccountPublicKey || ''}
                  variant={HashVariant.CaptionHash}
                  truncated
                  truncatedSize="tiny"
                  color="contentPrimary"
                />
              </AlignedFlexRow>
              <SvgIcon src="assets/icons/ic-arrow-with-tail.svg" size={16} />
              <AlignedFlexRow gap={SpacingSize.Small}>
                <Avatar publicKey={toAccountPublicKey || ''} size={24} />
                <Hash
                  value={toAccountPublicKey || ''}
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
              value={deployInfo.deploy_hash}
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
                {`${transferAmountInCSPR} CSPR`}
              </Typography>
              <Typography type="listSubtext" color="contentSecondary">
                {transferAmountInUSD}
              </Typography>
            </RightAlignedFlexColumn>
          </AmountContainer>
          <AmountContainer>
            <Typography type="captionRegular" color="contentSecondary">
              <Trans t={t}>Cost</Trans>
            </Typography>
            <RightAlignedFlexColumn>
              <Typography type="captionHash">
                {`${costAmountInCSPR} CSPR`}
              </Typography>
              <Typography type="listSubtext" color="contentSecondary">
                {costAmountInUSD}
              </Typography>
            </RightAlignedFlexColumn>
          </AmountContainer>
        </RowsContainer>
      </Tile>
    </ContentContainer>
  );
};
