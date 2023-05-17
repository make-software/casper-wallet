import React, { forwardRef, useEffect, useState } from 'react';
import styled from 'styled-components';
import { useSelector } from 'react-redux';

import {
  AlignedFlexRow,
  AlignedSpaceBetweenFlexRow,
  CenteredFlexRow,
  LeftAlignedFlexColumn,
  RightAlignedFlexColumn,
  SpaceBetweenFlexRow,
  SpacingSize
} from '@libs/layout';
import { ContentColor, Link, SvgIcon, Typography, Tooltip } from '@libs/ui';
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
  Transaction,
  getDeployHashLink
} from '@libs/services/transactions-service';

const TransactionContainer = styled(AlignedSpaceBetweenFlexRow)`
  padding: 14px 12px;
`;

const IconCircleContainer = styled(CenteredFlexRow)`
  min-width: 28px;
  width: 28px;
  height: 28px;

  margin-right: 4px;

  background-color: ${({ theme }) => theme.color.fillSecondary};
  border-radius: ${({ theme }) => theme.borderRadius.hundred}px;
`;

export enum Type {
  Sent = 'Sent',
  Received = 'Received'
}

export enum Status {
  Success = 'Success',
  Failed = 'Failed',
  Pending = 'Pending'
}

interface TransactionPlateProps {
  transactionInfo: Transaction;
}

type Ref = HTMLDivElement;

export const TransactionPlate = forwardRef<Ref, TransactionPlateProps>(
  (
    {
      transactionInfo: { deployHash, amount, fromAccountPublicKey, timestamp }
    },
    ref
  ) => {
    const [type, setType] = useState<Type>();

    const activeAccount = useSelector(selectVaultActiveAccount);
    const { casperLiveUrl } = useSelector(selectApiConfigBasedOnActiveNetwork);

    // TODO: fix transaction status
    const status = Status.Success;

    let iconSrc = '';
    let statusColor: ContentColor;

    useEffect(() => {
      if (fromAccountPublicKey === activeAccount?.publicKey) {
        setType(Type.Sent);
      } else {
        setType(Type.Received);
      }
    }, [fromAccountPublicKey, activeAccount?.publicKey]);

    switch (type) {
      case Type.Sent: {
        iconSrc = 'assets/icons/sent.svg';
        break;
      }
      case Type.Received: {
        iconSrc = 'assets/icons/receive.svg';
        break;
      }
    }

    switch (status) {
      case Status.Success: {
        statusColor = 'contentGreen';
        break;
      }
      // case Status.Failed: {
      //   statusColor = 'contentRed';
      //   break;
      // }
      // case Status.Pending: {
      //   statusColor = 'contentLightBlue';
      //   break;
      // }
    }

    return (
      <TransactionContainer gap={SpacingSize.Small} ref={ref}>
        <IconCircleContainer>
          <SvgIcon src={iconSrc} size={16} />
        </IconCircleContainer>
        <SpaceBetweenFlexRow>
          <LeftAlignedFlexColumn>
            <AlignedFlexRow gap={SpacingSize.Small}>
              <Typography type="bodySemiBold">
                {type === Type.Sent ? Type.Sent : Type.Received}
              </Typography>
              <Typography type="labelMedium" color={statusColor}>
                {status}
              </Typography>
            </AlignedFlexRow>
            <AlignedFlexRow gap={SpacingSize.Small}>
              <Link
                color="fillBlue"
                href={getDeployHashLink(deployHash, casperLiveUrl)}
                target="_blank"
              >
                <Typography type="captionHash">
                  {truncateKey(deployHash, { size: 'tiny' })}
                </Typography>
              </Link>
              <Tooltip title={formatTimestamp(timestamp)}>
                <Typography type="captionHash" color="contentSecondary" noWrap>
                  {formatTimestampAge(timestamp)}
                </Typography>
              </Tooltip>
            </AlignedFlexRow>
          </LeftAlignedFlexColumn>
          <RightAlignedFlexColumn>
            <Typography type="captionHash">
              {type === Type.Sent ? '-' : ''}
              {formatNumber(motesToCSPR(amount), {
                precision: { max: 5 }
              })}
            </Typography>
            <Typography type="bodyHash" color="contentSecondary">
              CSPR
            </Typography>
          </RightAlignedFlexColumn>
        </SpaceBetweenFlexRow>
        <SvgIcon src="assets/icons/chevron.svg" size={16} />
      </TransactionContainer>
    );
  }
);
