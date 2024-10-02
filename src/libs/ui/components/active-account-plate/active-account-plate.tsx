import React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { selectVaultActiveAccount } from '@background/redux/vault/selectors';

import { getAccountHashFromPublicKey } from '@libs/entities/Account';
import {
  AlignedFlexRow,
  ParagraphContainer,
  SpaceBetweenFlexColumn,
  SpaceBetweenFlexRow,
  SpacingSize,
  TileContainer
} from '@libs/layout';
import { useFetchAccountsInfo } from '@libs/services/account-info';
import {
  Avatar,
  Hash,
  HashVariant,
  Tile,
  Tooltip,
  Typography
} from '@libs/ui/components';

const AmountContainer = styled(SpaceBetweenFlexColumn)`
  align-items: flex-end;

  max-width: 120px;
`;

const NameContainer = styled(SpaceBetweenFlexColumn)`
  align-items: flex-start;

  max-width: 120px;
`;

const Container = styled(TileContainer)`
  margin-top: 8px;
`;

interface ActiveAccountPlateProps {
  label: string;
  balance: string | undefined;
  symbol: string | null;
  top?: SpacingSize;
}

export const ActiveAccountPlate = ({
  label,
  symbol,
  balance,
  top
}: ActiveAccountPlateProps) => {
  const { t } = useTranslation();

  const activeAccount = useSelector(selectVaultActiveAccount);

  const accountsInfo = useFetchAccountsInfo([activeAccount?.publicKey!]);

  const accountHash = getAccountHashFromPublicKey(activeAccount?.publicKey);

  const csprName = accountsInfo && accountsInfo[accountHash]?.csprName;
  const brandingLogo = accountsInfo && accountsInfo[accountHash]?.brandingLogo;

  if (!activeAccount) {
    return null;
  }

  return (
    <>
      <ParagraphContainer top={top || SpacingSize.XXL}>
        <Typography type="bodySemiBold">
          <Trans t={t}>{label}</Trans>
        </Typography>
      </ParagraphContainer>
      <Tile>
        <Container paddingVertical={SpacingSize.Small}>
          <SpaceBetweenFlexRow>
            <AlignedFlexRow gap={SpacingSize.Medium}>
              <Avatar
                publicKey={activeAccount.publicKey}
                brandingLogo={brandingLogo}
                size={24}
              />
              <NameContainer>
                <Tooltip
                  title={activeAccount.name}
                  placement="topLeft"
                  overflowWrap
                  fullWidth
                >
                  <Typography type="captionMedium" ellipsis>
                    {activeAccount.name}
                  </Typography>
                </Tooltip>
                <Hash
                  value={activeAccount.publicKey}
                  csprName={csprName}
                  variant={HashVariant.CaptionHash}
                  color="contentSecondary"
                  truncated
                  placement="bottomRight"
                />
              </NameContainer>
            </AlignedFlexRow>
            <AmountContainer>
              <Tooltip
                title={balance && balance?.length > 9 ? balance : undefined}
                placement="topLeft"
                overflowWrap
                fullWidth
              >
                <Typography type="captionHash" ellipsis>
                  {balance || '-'}
                </Typography>
              </Tooltip>
              <Typography type="captionHash" color="contentSecondary">
                {symbol || '-'}
              </Typography>
            </AmountContainer>
          </SpaceBetweenFlexRow>
        </Container>
      </Tile>
    </>
  );
};
