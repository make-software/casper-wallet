import { IEIP712SignatureRequest } from 'casper-wallet-core';
import React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import styled from 'styled-components';

import {
  AlignedFlexRow,
  ContentContainer,
  FlexColumn,
  PageContainer,
  SpacingSize,
  VerticalSpaceContainer
} from '@libs/layout';
import { List, SvgIcon, Tile, Typography } from '@libs/ui/components';
import { MaybeLink } from '@libs/ui/components/maybe-link/maybe-link';
import { getFaviconUrlFromOrigin } from '@libs/ui/components/site-favicon-badge/site-favicon-badge';

import { Eip712DisplayRow } from './eip712-display-row';

const RowDataContainer = styled(AlignedFlexRow)`
  margin: 16px;
  width: unset;
  min-height: 56px;
  cursor: pointer;
`;

const Favicon = styled.img`
  width: 40px;
  height: 40px;

  object-fit: contain;
  object-position: center;

  border-radius: ${({ theme }) => theme.borderRadius.twenty}px;
`;

interface SignEip712ContentProps {
  signatureRequest: IEIP712SignatureRequest;
  origin: string | null;
  handlePressShowRawJson: () => void;
}

export function SignEip712Content({
  signatureRequest,
  origin,
  handlePressShowRawJson
}: SignEip712ContentProps) {
  const { t } = useTranslation();
  const faviconUrl = getFaviconUrlFromOrigin(origin);

  return (
    <PageContainer>
      <ContentContainer>
        <VerticalSpaceContainer top={SpacingSize.Medium}>
          <AlignedFlexRow gap={SpacingSize.Small}>
            {faviconUrl && (
              <div>
                <Favicon src={faviconUrl} />
              </div>
            )}
            <FlexColumn flexGrow={1}>
              <Typography type="header">
                <Trans t={t}>Signature Request</Trans>
              </Typography>
              <MaybeLink link={origin}>
                <Typography
                  type="captionRegular"
                  color={'contentAction'}
                  ellipsis
                  style={{ maxWidth: '296px' }}
                >
                  <Trans t={t}>{origin}</Trans>
                </Typography>
              </MaybeLink>
            </FlexColumn>
          </AlignedFlexRow>
        </VerticalSpaceContainer>

        <List
          headerLabel={t('Domain')}
          rows={signatureRequest.domainRows.map((row, index) => ({
            id: `domain-${index}-${row.label}`,
            label: row.label,
            value: row
          }))}
          renderRow={({ value }) => <Eip712DisplayRow row={value} />}
          marginLeftForItemSeparatorLine={16}
        />

        <List
          headerLabel={signatureRequest.primaryType}
          rows={signatureRequest.messageRows.map((row, index) => ({
            id: `message-${index}-${row.label}`,
            label: row.label,
            value: row
          }))}
          renderRow={({ value }) => <Eip712DisplayRow row={value} />}
          marginLeftForItemSeparatorLine={16}
        />

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
