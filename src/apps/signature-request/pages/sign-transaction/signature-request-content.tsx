import {
  IAccountInfo,
  ITxSignatureRequest,
  isKeysEqual
} from 'casper-wallet-core';
import React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import styled from 'styled-components';

import {
  AlignedFlexRow,
  ContentContainer,
  FlexColumn,
  LeftAlignedFlexColumn,
  PageContainer,
  SpaceBetweenFlexRow,
  SpacingSize,
  VerticalSpaceContainer
} from '@libs/layout';
import { List, SvgIcon, Tile, Typography } from '@libs/ui/components';
import { AccountInfoRow } from '@libs/ui/components/account-info-row/account-info-row';
import { MaybeLink } from '@libs/ui/components/maybe-link/maybe-link';
import { PortalTooltip } from '@libs/ui/components/portal-tooltip/portal-tooltip';

import { SignatureRequestAction } from './signature-request-action';
import { SignatureRequestValue } from './signature-request-value';
import { mapTxKeyToLabel } from './utils';

const ListItemContainer = styled(SpaceBetweenFlexRow)`
  margin: 16px;
  width: unset;
`;

const RowDataContainer = styled(AlignedFlexRow)`
  margin: 16px;
  width: unset;
  min-height: 56px;
  cursor: pointer;
`;

const WeightContainer = styled(AlignedFlexRow)`
  padding: 4px 12px;
  background-color: ${({ theme }) => theme.color.backgroundSecondary};
  border-radius: ${({ theme }) => theme.borderRadius.base}px;
`;

const Favicon = styled.img`
  width: 40px;
  height: 40px;

  object-fit: contain;
  object-position: center;

  border-radius: ${({ theme }) => theme.borderRadius.twenty}px;
`;

export interface SignatureRequestContentProps {
  signatureRequest: ITxSignatureRequest;
  signingPublicKeyHex: string;
  activeOriginFavicon: string | null;
  activeOrigin: string | null;
  handlePressShowRawJson: () => void;
}

export type TxCommonDetailsKeys =
  | 'network'
  | 'memo'
  | 'txHash'
  | 'expires'
  | 'fee'
  | 'sender';

export interface ISignatureRequestRecords {
  network: string;
  txHash: string;
  memo?: string;
  fee: ISignatureRequestRecordFeeValue;
  sender?: ISignatureRequestRecordSenderValue;
  expires: string;
}

export interface ISignatureRequestRecordFeeValue {
  feeValue: string;
  feeSuffix: string;
}

export interface ISignatureRequestRecordSenderValue {
  key: string;
  accountInfo: IAccountInfo | null;
}

export function SignatureRequestContent({
  signatureRequest,
  activeOriginFavicon,
  activeOrigin,
  handlePressShowRawJson
}: SignatureRequestContentProps) {
  const { t } = useTranslation();

  const deployDetailRecords: ISignatureRequestRecords = {
    network: signatureRequest.chainName,
    txHash: signatureRequest.txHash,
    ...(signatureRequest.memo ? { memo: signatureRequest.memo } : {}),
    fee: {
      feeValue: signatureRequest.formattedPaymentAmount,
      feeSuffix: ` CSPR${
        signatureRequest.fiatPaymentAmount
          ? ` (${signatureRequest.fiatPaymentAmount})`
          : ''
      }`
    },
    ...(!isKeysEqual(signatureRequest.signingKey, signatureRequest.senderKey)
      ? {
          sender: {
            key: signatureRequest.senderKey ?? '',
            accountInfo: signatureRequest.senderAccountInfo
          }
        }
      : {}),
    expires: signatureRequest.expires
  };

  return (
    <PageContainer>
      <ContentContainer>
        <VerticalSpaceContainer top={SpacingSize.Medium}>
          <AlignedFlexRow gap={SpacingSize.Small}>
            {activeOriginFavicon && (
              <div>
                <Favicon src={activeOriginFavicon} />
              </div>
            )}
            <FlexColumn flexGrow={1}>
              <Typography type="header">
                <Trans t={t}>Signature Request</Trans>
              </Typography>
              <MaybeLink link={activeOrigin}>
                <Typography
                  type="captionRegular"
                  color={'contentAction'}
                  ellipsis
                  style={{ maxWidth: '296px' }}
                >
                  <Trans t={t}>{activeOrigin}</Trans>
                </Typography>
              </MaybeLink>
            </FlexColumn>
          </AlignedFlexRow>
        </VerticalSpaceContainer>

        <SignatureRequestAction signatureRequest={signatureRequest} />

        <LeftAlignedFlexColumn gap={SpacingSize.Medium}></LeftAlignedFlexColumn>

        <List
          rows={Object.entries(deployDetailRecords).map(([key, value]) => ({
            id: key,
            label: t(mapTxKeyToLabel[key as TxCommonDetailsKeys]),
            value
          }))}
          renderRow={({ id, label, value }) => (
            <ListItemContainer key={id}>
              <AlignedFlexRow
                gap={SpacingSize.Small}
                flexGrow={1}
                wrap="nowrap"
              >
                <Typography
                  type="body"
                  color="contentSecondary"
                  noWrap={id === 'fee'}
                >
                  {label}
                </Typography>
                {id === 'fee' && (
                  <PortalTooltip
                    title={
                      <Typography
                        type="captionRegular"
                        overflowWrap
                        color="contentPrimary"
                      >
                        <Trans t={t}>
                          {signatureRequest.action.type === 'CSPR_NATIVE' ||
                          signatureRequest.action.type === 'AUCTION'
                            ? 'Fee required to process the transaction'
                            : 'Payment amount that limits the transaction processing cost'}
                        </Trans>
                      </Typography>
                    }
                  >
                    <SvgIcon
                      src="assets/icons/info.svg"
                      size={16}
                      color={'contentAction'}
                    />
                  </PortalTooltip>
                )}
              </AlignedFlexRow>
              <SignatureRequestValue
                id={id as TxCommonDetailsKeys}
                value={value}
              />
            </ListItemContainer>
          )}
          marginLeftForItemSeparatorLine={16}
        />

        {Boolean(signatureRequest.signaturesCollected.length) && (
          <List
            headerLabel={t('Signatures collected')}
            rows={signatureRequest.signaturesCollected.map(data => ({
              id: data.publicKey,
              label: data.publicKey,
              value: data
            }))}
            renderRow={({ id, value }) => (
              <ListItemContainer key={id}>
                <WeightContainer gap={SpacingSize.Small} wrap="nowrap">
                  <Typography type="body" color="contentSecondary">
                    {t('Weight:')}
                  </Typography>
                  <Typography type="bodyHash" color="contentPrimary">
                    {value.weight ?? 1}
                  </Typography>
                </WeightContainer>
                <AccountInfoRow
                  isAction
                  iconSize={20}
                  publicKey={value.publicKey}
                  csprName={value.accountInfo?.csprName}
                  imgLogo={value.accountInfo?.brandingLogo}
                  accountName={value.accountInfo?.name}
                  accountLink={value.accountInfo?.explorerLink}
                  withCopyIcon
                />
              </ListItemContainer>
            )}
            marginLeftForItemSeparatorLine={16}
          />
        )}

        <Tile>
          <RowDataContainer
            tabIndex={0}
            role="button"
            gap={SpacingSize.Small}
            onClick={handlePressShowRawJson}
          >
            <Typography type="body" color="contentAction">
              <Trans t={t}>Show raw data</Trans>
            </Typography>
            <SvgIcon
              src="assets/icons/chevron.svg"
              size={16}
              color={'contentAction'}
            />
          </RowDataContainer>
        </Tile>
      </ContentContainer>
    </PageContainer>
  );
}
