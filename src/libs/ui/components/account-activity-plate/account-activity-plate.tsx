import React, { forwardRef, useEffect, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import {
  ActivityShortTypeName,
  ActivityType,
  ActivityTypeColors,
  ActivityTypeIcons,
  ActivityTypeName,
  AuctionManagerEntryPoint,
  TokenEntryPoint
} from '@src/constants';

import { RouterPath, useTypedNavigate } from '@popup/router';

import { selectVaultActiveAccount } from '@background/redux/vault/selectors';

import { getAccountHashFromPublicKey } from '@libs/entities/Account';
import {
  AccountActivityPlateContainer,
  ActivityPlateContentContainer,
  ActivityPlateDivider,
  ActivityPlateIconCircleContainer,
  AlignedFlexRow,
  AlignedSpaceBetweenFlexRow,
  RightAlignedCenteredFlexRow,
  SpacingSize
} from '@libs/layout';
import {
  Erc20TransferWithId,
  ExtendedDeployWithId
} from '@libs/services/account-activity-service';
import {
  DeployStatus,
  Hash,
  HashVariant,
  SvgIcon,
  Tooltip,
  Typography
} from '@libs/ui/components';
import {
  ContentColor,
  getRecipientAddressFromTransaction
} from '@libs/ui/utils';
import {
  divideErc20Balance,
  formatNumber,
  formatTimestamp,
  formatTimestampAge,
  motesToCSPR
} from '@libs/ui/utils/formatters';

const SymbolContainer = styled(RightAlignedCenteredFlexRow)`
  max-width: 80px;
`;

const AmountContainer = styled(RightAlignedCenteredFlexRow)`
  max-width: 120px;
`;

interface AccountActivityPlateProps {
  transactionInfo: Erc20TransferWithId | ExtendedDeployWithId;
  onClick?: () => void;
  isDeploysList?: boolean;
}

type Ref = HTMLDivElement;

export const AccountActivityPlate = forwardRef<Ref, AccountActivityPlateProps>(
  ({ transactionInfo, onClick, isDeploysList }, ref) => {
    const [type, setType] = useState<ActivityType | null>(null);
    const [fromAccount, setFromAccount] = useState<string | undefined>(
      undefined
    );
    const [toAccount, setToAccount] = useState<string | undefined>(undefined);

    const navigate = useTypedNavigate();
    const { t } = useTranslation();

    const activeAccount = useSelector(selectVaultActiveAccount);

    const activeAccountHash = getAccountHashFromPublicKey(
      activeAccount?.publicKey
    );

    const { deployHash, callerPublicKey, timestamp, args } = transactionInfo;
    let decimals: number | undefined;
    let symbol: string | undefined;
    let amount: string | null = null;

    if ('contractPackage' in transactionInfo) {
      decimals = transactionInfo?.contractPackage?.metadata?.decimals;
      symbol = transactionInfo?.contractPackage?.metadata?.symbol;
    }

    const { recipientAddress } = getRecipientAddressFromTransaction(
      transactionInfo,
      activeAccount?.publicKey || ''
    );

    const fromAccountPublicKey =
      'fromPublicKey' in transactionInfo && transactionInfo.fromPublicKey
        ? transactionInfo.fromPublicKey
        : callerPublicKey;

    try {
      if (transactionInfo.amount) {
        amount =
          Number.isInteger(decimals) && decimals !== undefined
            ? divideErc20Balance(transactionInfo.amount, decimals)
            : motesToCSPR(transactionInfo.amount);
      } else {
        const parsedAmount =
          ((typeof args?.amount?.parsed === 'string' ||
            typeof args?.amount?.parsed === 'number') &&
            args?.amount?.parsed) ||
          '-';

        if (parsedAmount !== '-') {
          const stringAmount =
            typeof parsedAmount === 'number'
              ? parsedAmount.toString()
              : parsedAmount;

          amount =
            Number.isInteger(decimals) && decimals !== undefined
              ? divideErc20Balance(stringAmount, decimals)
              : motesToCSPR(stringAmount);
        }
      }
    } catch (error) {
      console.error(error);
    }

    const formattedAmount = amount
      ? formatNumber(amount, {
          precision: { min: 5 }
        })
      : '-';

    useEffect(() => {
      if ('entryPoint' in transactionInfo) {
        switch (transactionInfo.entryPoint?.name) {
          case AuctionManagerEntryPoint.undelegate: {
            setType(ActivityType.Undelegated);
            setFromAccount(transactionInfo.args.validator?.parsed as string);
            setToAccount(transactionInfo.args.delegator?.parsed as string);
            return;
          }
          case AuctionManagerEntryPoint.delegate: {
            setType(ActivityType.Delegated);
            setFromAccount(transactionInfo.args.delegator?.parsed as string);
            setToAccount(transactionInfo.args.validator?.parsed as string);
            return;
          }
          case AuctionManagerEntryPoint.redelegate: {
            setType(ActivityType.Redelegated);
            setFromAccount(transactionInfo.args.validator?.parsed as string);
            setToAccount(transactionInfo.args.new_validator?.parsed as string);
            return;
          }
          case TokenEntryPoint.mint: {
            setType(ActivityType.Mint);
            setFromAccount(transactionInfo.callerPublicKey);
            setToAccount(recipientAddress);
            return;
          }
          case TokenEntryPoint.burn: {
            setType(ActivityType.Burn);
            setFromAccount(transactionInfo.callerPublicKey);
            setToAccount(undefined);
            return;
          }
          case TokenEntryPoint.transfer: {
            if (
              transactionInfo?.args?.token_ids ||
              transactionInfo?.args?.token_id
            ) {
              setType(ActivityType.TransferNft);
              setFromAccount(transactionInfo.callerPublicKey);
              setToAccount(recipientAddress);
              return;
            }
          }
        }
      }

      if (fromAccountPublicKey === activeAccount?.publicKey) {
        setType(ActivityType.Sent);
      } else if (
        recipientAddress === activeAccount?.publicKey ||
        recipientAddress === activeAccountHash
      ) {
        setType(ActivityType.Received);
      } else {
        setType(ActivityType.Unknown);
      }
    }, [
      fromAccountPublicKey,
      activeAccount?.publicKey,
      recipientAddress,
      activeAccountHash,
      transactionInfo
    ]);

    return (
      <AccountActivityPlateContainer
        gap={SpacingSize.Small}
        ref={ref}
        onClick={() => {
          navigate(RouterPath.ActivityDetails, {
            state: {
              activityDetailsData: {
                fromAccount: fromAccount || fromAccountPublicKey,
                toAccount: toAccount || recipientAddress,
                deployHash,
                type,
                amount: formattedAmount,
                symbol: symbol || '',
                isDeploysList: isDeploysList
              }
            }
          });
          if (onClick) {
            onClick();
          }
        }}
      >
        <ActivityPlateIconCircleContainer>
          {type != null && (
            <SvgIcon
              src={ActivityTypeIcons[type]}
              size={16}
              color={ActivityTypeColors[type] as ContentColor}
            />
          )}
        </ActivityPlateIconCircleContainer>
        <ActivityPlateContentContainer>
          <AlignedSpaceBetweenFlexRow>
            <AlignedFlexRow gap={SpacingSize.Small}>
              <Typography type="bodySemiBold">
                <Trans t={t}>
                  {type != null &&
                    (formattedAmount.length >= 13
                      ? ActivityShortTypeName[type]
                      : ActivityTypeName[type])}
                </Trans>
              </Typography>
              <DeployStatus deployResult={transactionInfo} />
            </AlignedFlexRow>
            <Tooltip
              overflowWrap
              title={formattedAmount.length > 11 ? formattedAmount : undefined}
            >
              <AmountContainer>
                <Typography type="captionHash" ellipsis>
                  {formattedAmount === '-' ? null : (
                    <>
                      {type === ActivityType.Sent ||
                      type === ActivityType.Delegated
                        ? '-'
                        : ''}
                      {formattedAmount}
                    </>
                  )}
                </Typography>
              </AmountContainer>
            </Tooltip>
          </AlignedSpaceBetweenFlexRow>
          <AlignedSpaceBetweenFlexRow>
            <AlignedFlexRow>
              <Hash
                value={deployHash}
                variant={HashVariant.CaptionHash}
                truncated
                truncatedSize="tiny"
                color="contentPrimary"
                placement="bottomRight"
              />
              <ActivityPlateDivider />
              <Tooltip title={formatTimestamp(timestamp)} noWrap>
                <Typography
                  type="captionRegular"
                  color="contentSecondary"
                  noWrap
                >
                  {formatTimestampAge(timestamp)}
                </Typography>
              </Tooltip>
            </AlignedFlexRow>
            {formattedAmount !== '-' && (
              <Tooltip title={symbol && symbol.length > 8 ? symbol : undefined}>
                <SymbolContainer>
                  <Typography type="bodyHash" color="contentSecondary" ellipsis>
                    {symbol || 'CSPR'}
                  </Typography>
                </SymbolContainer>
              </Tooltip>
            )}
          </AlignedSpaceBetweenFlexRow>
        </ActivityPlateContentContainer>
        <SvgIcon src="assets/icons/chevron.svg" size={16} />
      </AccountActivityPlateContainer>
    );
  }
);
