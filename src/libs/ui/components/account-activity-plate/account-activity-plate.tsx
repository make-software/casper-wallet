import React, { forwardRef, useEffect, useState } from 'react';
import styled from 'styled-components';
import { useSelector } from 'react-redux';
import { Trans, useTranslation } from 'react-i18next';

import {
  AlignedFlexRow,
  AlignedSpaceBetweenFlexRow,
  CenteredFlexRow,
  FlexColumn,
  SpacingSize
} from '@libs/layout';
import {
  DeployStatus,
  Hash,
  HashVariant,
  SvgIcon,
  Tooltip,
  Typography
} from '@libs/ui';
import {
  divideErc20Balance,
  formatNumber,
  formatTimestamp,
  formatTimestampAge,
  motesToCSPR
} from '@libs/ui/utils/formatters';
import { selectVaultActiveAccount } from '@background/redux/vault/selectors';
import {
  Erc20TransferWithId,
  ExtendedDeployWithId
} from '@libs/services/account-activity-service';
import { RouterPath, useTypedNavigate } from '@popup/router';
import {
  ShortTypeName,
  TransferType,
  TypeIcons,
  TypeName
} from '@src/constants';
import { getAccountHashFromPublicKey } from '@libs/entities/Account';
import { getRecipientAddressFromTransaction } from '@libs/ui/utils/utils';

const AccountActivityPlateContainer = styled(AlignedSpaceBetweenFlexRow)`
  cursor: pointer;
  padding: 16px 12px;
`;

const IconCircleContainer = styled(CenteredFlexRow)`
  min-width: 28px;

  width: 28px;
  height: 28px;

  margin-right: 4px;

  background-color: ${({ theme }) => theme.color.fillSecondary};
  border-radius: ${({ theme }) => theme.borderRadius.hundred}px;
`;

const ContentContainer = styled(FlexColumn)`
  flex-grow: 1;
  gap: 2px;
`;

const Divider = styled.div`
  width: 2px;
  height: 2px;

  margin: 0 6px;

  border-radius: ${({ theme }) => theme.borderRadius.hundred}px;
  background-color: ${({ theme }) => theme.color.contentSecondary};
`;

interface AccountActivityPlateProps {
  transactionInfo: Erc20TransferWithId | ExtendedDeployWithId;
}

type Ref = HTMLDivElement;

export const AccountActivityPlate = forwardRef<Ref, AccountActivityPlateProps>(
  ({ transactionInfo }, ref) => {
    const [type, setType] = useState<TransferType | null>(null);

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
    } catch (error) {
      console.error(error);
    }

    const formattedAmount = amount
      ? formatNumber(amount, {
          precision: { min: 5 }
        })
      : '-';

    useEffect(() => {
      if (fromAccountPublicKey === activeAccount?.publicKey) {
        setType(TransferType.Sent);
      } else if (
        recipientAddress === activeAccount?.publicKey ||
        recipientAddress === activeAccountHash
      ) {
        setType(TransferType.Received);
      } else {
        setType(TransferType.Unknown);
      }
    }, [
      fromAccountPublicKey,
      activeAccount?.publicKey,
      recipientAddress,
      activeAccountHash
    ]);

    return (
      <AccountActivityPlateContainer
        gap={SpacingSize.Small}
        ref={ref}
        onClick={() =>
          navigate(RouterPath.ActivityDetails, {
            state: {
              activityDetailsData: {
                fromAccount: fromAccountPublicKey,
                toAccount: recipientAddress,
                deployHash,
                type,
                amount: formattedAmount,
                symbol: symbol || ''
              }
            }
          })
        }
      >
        <IconCircleContainer>
          {type != null && <SvgIcon src={TypeIcons[type]} size={16} />}
        </IconCircleContainer>
        <ContentContainer>
          <AlignedSpaceBetweenFlexRow>
            <AlignedFlexRow gap={SpacingSize.Small}>
              <Typography type="bodySemiBold">
                <Trans t={t}>
                  {type != null &&
                    (formattedAmount.length >= 13
                      ? ShortTypeName[type]
                      : TypeName[type])}
                </Trans>
              </Typography>
              <DeployStatus deployResult={transactionInfo} />
            </AlignedFlexRow>
            <Typography type="captionHash">
              {formattedAmount === '-' ? (
                formattedAmount
              ) : (
                <>
                  {type === TransferType.Sent ? '-' : ''}
                  {formattedAmount}
                </>
              )}
            </Typography>
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
              <Divider />
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
              <Typography type="bodyHash" color="contentSecondary">
                {symbol || 'CSPR'}
              </Typography>
            )}
          </AlignedSpaceBetweenFlexRow>
        </ContentContainer>
        <SvgIcon src="assets/icons/chevron.svg" size={16} />
      </AccountActivityPlateContainer>
    );
  }
);
