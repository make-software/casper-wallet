import React, { forwardRef, useEffect, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { RouterPath, useTypedNavigate } from '@popup/router';
import { Hash, HashVariant, SvgIcon, Tooltip, Typography } from '@libs/ui';
import { selectVaultActiveAccount } from '@background/redux/vault/selectors';
import {
  formatNumber,
  formatTimestamp,
  formatTimestampAge,
  motesToCSPR
} from '@libs/ui/utils/formatters';
import {
  AlignedFlexRow,
  AlignedSpaceBetweenFlexRow,
  CenteredFlexRow,
  FlexColumn,
  SpacingSize
} from '@libs/layout';
import {
  ShortTypeName,
  TransferType,
  TypeIcons,
  TypeName
} from '@src/constants';
import { TransferResultWithId } from '@libs/services/account-activity-service';
import { getAccountHashFromPublicKey } from '@libs/entities/Account';

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

type Ref = HTMLDivElement;

interface AccountCasperActivityPlateProps {
  transactionInfo: TransferResultWithId;
}
export const AccountCasperActivityPlate = forwardRef<
  Ref,
  AccountCasperActivityPlateProps
>(({ transactionInfo }, ref) => {
  const [type, setType] = useState<TransferType | null>(null);

  const navigate = useTypedNavigate();
  const { t } = useTranslation();

  const activeAccount = useSelector(selectVaultActiveAccount);
  const activeAccountHash = getAccountHashFromPublicKey(
    activeAccount?.publicKey
  );

  const {
    deployHash,
    fromAccountPublicKey,
    timestamp,
    amount,
    toAccountPublicKey,
    toAccount,
    fromAccount,
    targetPurse
  } = transactionInfo;

  const formattedAmount = formatNumber(motesToCSPR(amount), {
    precision: { min: 5 }
  });

  useEffect(() => {
    if (
      fromAccountPublicKey?.toLowerCase() ===
        activeAccount?.publicKey.toLowerCase() ||
      fromAccount?.toLowerCase() === activeAccountHash?.toLowerCase()
    ) {
      setType(TransferType.Sent);
    } else if (
      toAccountPublicKey?.toLowerCase() ===
        activeAccount?.publicKey.toLowerCase() ||
      toAccount?.toLowerCase() === activeAccountHash?.toLowerCase()
    ) {
      setType(TransferType.Received);
    } else {
      setType(TransferType.Unknown);
    }
  }, [
    fromAccountPublicKey,
    activeAccount?.publicKey,
    toAccountPublicKey,
    fromAccount,
    activeAccountHash,
    toAccount
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
              toAccount: toAccountPublicKey || toAccount || targetPurse,
              deployHash,
              type
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
          </AlignedFlexRow>
          <Typography type="captionHash">
            {type === TransferType.Sent ? '-' : ''}
            {formattedAmount}
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
            />
            <Divider />
            <Tooltip title={formatTimestamp(timestamp)} noWrap>
              <Typography type="captionRegular" color="contentSecondary" noWrap>
                {formatTimestampAge(timestamp)}
              </Typography>
            </Tooltip>
          </AlignedFlexRow>
          <Typography type="bodyHash" color="contentSecondary">
            CSPR
          </Typography>
        </AlignedSpaceBetweenFlexRow>
      </ContentContainer>
      <SvgIcon src="assets/icons/chevron.svg" size={16} />
    </AccountActivityPlateContainer>
  );
});
