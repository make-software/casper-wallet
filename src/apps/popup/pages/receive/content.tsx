import { QRCodeCanvas } from 'qrcode.react';
import React, { useEffect, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import styled, { useTheme } from 'styled-components';

import { formatCep18Tokens } from '@popup/pages/home/components/tokens-list/utils';
import { useTypedLocation } from '@popup/router';

import { selectVaultActiveAccount } from '@background/redux/vault/selectors';

import { useCopyToClipboard } from '@hooks/use-copy-to-clipboard';

import {
  ContentContainer,
  FlexColumn,
  ParagraphContainer,
  SpacingSize,
  VerticalSpaceContainer
} from '@libs/layout';
import { useFetchWalletBalance } from '@libs/services/balance-service';
import { useFetchCep18Tokens } from '@libs/services/cep18-service';
import { ActiveAccountPlate, Tile, Typography } from '@libs/ui/components';
import { motesToCSPR } from '@libs/ui/utils';

const Container = styled.div`
  padding: 20px 16px;
`;

const HashContainer = styled.div`
  cursor: pointer;

  &:hover span {
    color: ${({ theme }) => theme.color.contentAction};
  }
`;

interface ITokenData {
  balance: string;
  symbol: string;
}

export const ReceivePageContent = () => {
  const { t } = useTranslation();
  const theme = useTheme();

  const activeAccount = useSelector(selectVaultActiveAccount);

  const { handleCopyOnClick, isClicked } = useCopyToClipboard(
    activeAccount?.publicKey || ''
  );

  const location = useTypedLocation();
  const [tokenData, setTokenData] = useState<ITokenData>({
    balance: location?.state?.tokenData?.balance ?? '',
    symbol: location?.state?.tokenData?.symbol ?? ''
  });

  const { accountBalance } = useFetchWalletBalance();
  const { cep18Tokens } = useFetchCep18Tokens();

  useEffect(() => {
    if (tokenData?.symbol === 'CSPR') {
      const balance =
        (accountBalance.liquidBalance &&
          motesToCSPR(accountBalance.liquidBalance)) ||
        '0';
      setTokenData(prev => ({ ...prev, balance }));
    } else {
      const formatedCep18Tokens = formatCep18Tokens(cep18Tokens);
      const balance =
        formatedCep18Tokens?.find(t => t?.symbol === tokenData?.symbol)
          ?.amount ?? '0';
      setTokenData(prev => ({ ...prev, balance }));
    }
  }, [accountBalance.liquidBalance, tokenData?.symbol, cep18Tokens]);

  return (
    <ContentContainer>
      <ParagraphContainer top={SpacingSize.XL}>
        <Typography type="header">
          <Trans t={t}>Receive tokens</Trans>
        </Typography>
      </ParagraphContainer>
      <ActiveAccountPlate
        label="To account"
        symbol={tokenData?.symbol}
        balance={tokenData.balance}
      />
      <VerticalSpaceContainer top={SpacingSize.XXXL}>
        <Tile>
          <Container>
            <FlexColumn gap={SpacingSize.Medium}>
              <QRCodeCanvas
                id="qrCode"
                value={activeAccount?.publicKey || ''}
                size={296}
                fgColor={theme.color.contentPrimary}
                bgColor={theme.color.backgroundPrimary}
                level={'H'}
              />
              {isClicked ? (
                <Typography type="captionHash" color="contentPositive">
                  <Trans t={t}>Address copied!</Trans>
                </Typography>
              ) : (
                <HashContainer onClick={handleCopyOnClick}>
                  <Typography
                    type="captionHash"
                    color="contentPrimary"
                    overflowWrap
                  >
                    {activeAccount?.publicKey}
                  </Typography>
                </HashContainer>
              )}
            </FlexColumn>
          </Container>
        </Tile>
      </VerticalSpaceContainer>
    </ContentContainer>
  );
};
