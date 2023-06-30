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
import { Link, SvgIcon, Typography, Tooltip, DeployStatus } from '@libs/ui';
import { truncateKey } from '@libs/ui/components/hash/utils';
import {
  formatNumber,
  formatTimestampAge,
  motesToCSPR,
  formatTimestamp
} from '@libs/ui/utils/formatters';
import { selectApiConfigBasedOnActiveNetwork } from '@background/redux/settings/selectors';
import { selectVaultActiveAccount } from '@background/redux/vault/selectors';
import {
  ExtendedDeployResultWithId,
  LedgerLiveDeploysResult
} from '@libs/services/account-activity-service';
import { RouterPath, useTypedNavigate } from '@popup/router';
import { getBlockExplorerDeployUrl } from '@src/constants';

import { getPublicKeyFormTarget } from './utils';

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

export enum TransferType {
  Sent = 'Sent',
  Received = 'Received',
  Unknown = 'Unknown'
}

export const ShortTypeName = {
  [TransferType.Sent]: 'Sent',
  [TransferType.Received]: 'Recv',
  [TransferType.Unknown]: 'Unk'
};

export const TypeName = {
  [TransferType.Sent]: 'Sent',
  [TransferType.Received]: 'Received',
  [TransferType.Unknown]: 'Unknown'
};

const TypeIcons = {
  [TransferType.Sent]: 'assets/icons/transfer.svg',
  [TransferType.Received]: 'assets/icons/receive.svg',
  [TransferType.Unknown]: 'assets/icons/info.svg'
};

interface AccountActivityPlateProps {
  transactionInfo: LedgerLiveDeploysResult | ExtendedDeployResultWithId;
}

type Ref = HTMLDivElement;

export const AccountActivityPlate = forwardRef<Ref, AccountActivityPlateProps>(
  ({ transactionInfo }, ref) => {
    const [type, setType] = useState<TransferType | null>(null);

    const navigate = useTypedNavigate();
    const { t } = useTranslation();

    const activeAccount = useSelector(selectVaultActiveAccount);
    const { casperLiveUrl } = useSelector(selectApiConfigBasedOnActiveNetwork);

    const {
      deploy_hash: deployHash,
      caller_public_key: fromAccountPublicKey,
      timestamp,
      args: { amount: parsedAmount, target }
    } = transactionInfo;

    const toAccountPublicKey = getPublicKeyFormTarget(
      target,
      activeAccount?.publicKey
    );

    const amount = (parsedAmount?.parsed as string) || '';

    const amountInCSPR = formatNumber(motesToCSPR(amount), {
      precision: { min: 5, max: 5 }
    });

    useEffect(() => {
      if (fromAccountPublicKey === activeAccount?.publicKey) {
        setType(TransferType.Sent);
      } else if (toAccountPublicKey === activeAccount?.publicKey) {
        setType(TransferType.Received);
      } else {
        setType(TransferType.Unknown);
      }
    }, [fromAccountPublicKey, activeAccount?.publicKey, toAccountPublicKey]);

    return (
      <AccountActivityPlateContainer
        gap={SpacingSize.Small}
        ref={ref}
        onClick={() =>
          navigate(RouterPath.ActivityDetails, {
            state: {
              activityDetailsData: {
                fromAccountPublicKey,
                toAccountPublicKey,
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
                    (amountInCSPR.length >= 13
                      ? ShortTypeName[type]
                      : TypeName[type])}
                </Trans>
              </Typography>
              <DeployStatus deployResult={transactionInfo} />
            </AlignedFlexRow>
            <Typography type="captionHash">
              {type === TransferType.Sent ? '-' : ''}
              {amountInCSPR}
            </Typography>
          </AlignedSpaceBetweenFlexRow>
          <AlignedSpaceBetweenFlexRow>
            <AlignedFlexRow>
              <Tooltip title={deployHash} overflowWrap placement="bottomRight">
                <Link
                  color="fillBlue"
                  onClick={event => {
                    event.stopPropagation();
                    event.preventDefault();

                    window.open(
                      getBlockExplorerDeployUrl(casperLiveUrl, deployHash),
                      '_blank'
                    );
                  }}
                >
                  <Typography type="captionHash">
                    {truncateKey(deployHash, { size: 'tiny' })}
                  </Typography>
                </Link>
              </Tooltip>
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
            <Typography type="bodyHash" color="contentSecondary">
              CSPR
            </Typography>
          </AlignedSpaceBetweenFlexRow>
        </ContentContainer>
        <SvgIcon src="assets/icons/chevron.svg" size={16} />
      </AccountActivityPlateContainer>
    );
  }
);
