import React, { forwardRef, useEffect, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';

import { RouterPath, useTypedNavigate } from '@popup/router';
import {
  ContentColor,
  Hash,
  HashVariant,
  SvgIcon,
  Tooltip,
  Typography
} from '@libs/ui';
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
  AccountActivityPlateContainer,
  ActivityPlateDivider,
  ActivityPlateContentContainer,
  ActivityPlateIconCircleContainer,
  SpacingSize
} from '@libs/layout';
import {
  ShortTypeName,
  TransferType,
  TypeColors,
  TypeIcons,
  TypeName
} from '@src/constants';
import { TransferResultWithId } from '@libs/services/account-activity-service';
import { getAccountHashFromPublicKey } from '@libs/entities/Account';

type Ref = HTMLDivElement;

interface AccountCasperActivityPlateProps {
  transactionInfo: TransferResultWithId;
  onClick?: () => void;
}
export const AccountCasperActivityPlate = forwardRef<
  Ref,
  AccountCasperActivityPlateProps
>(({ transactionInfo, onClick }, ref) => {
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
      fromAccountPublicKey === activeAccount?.publicKey ||
      fromAccount === activeAccountHash
    ) {
      setType(TransferType.Sent);
    } else if (
      toAccountPublicKey === activeAccount?.publicKey ||
      toAccount === activeAccountHash
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
      onClick={() => {
        navigate(RouterPath.ActivityDetails, {
          state: {
            activityDetailsData: {
              fromAccount: fromAccountPublicKey,
              toAccount: toAccountPublicKey || toAccount || targetPurse,
              deployHash,
              type
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
            src={TypeIcons[type]}
            size={16}
            color={TypeColors[type] as ContentColor}
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
              placement="bottomRight"
            />
            <ActivityPlateDivider />
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
      </ActivityPlateContentContainer>
      <SvgIcon src="assets/icons/chevron.svg" size={16} />
    </AccountActivityPlateContainer>
  );
});
