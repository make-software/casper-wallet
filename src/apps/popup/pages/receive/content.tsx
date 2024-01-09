import { QRCodeSVG } from 'qrcode.react';
import React, { useEffect, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { shallowEqual, useSelector } from 'react-redux';
import styled from 'styled-components';

import { formatErc20TokenBalance } from '@popup/pages/home/components/tokens-list/utils';
import { useTypedLocation } from '@popup/router';

import {
  selectAccountBalance,
  selectErc20Tokens
} from '@background/redux/account-info/selectors';
import { selectVaultActiveAccount } from '@background/redux/vault/selectors';

import { useCopyToClipboard } from '@hooks/use-copy-to-clipboard';

import {
  ContentContainer,
  FlexColumn,
  ParagraphContainer,
  SpacingSize,
  VerticalSpaceContainer
} from '@libs/layout';
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

  const activeAccount = useSelector(selectVaultActiveAccount);

  const { handleCopyOnClick, isClicked } = useCopyToClipboard(
    activeAccount?.publicKey || ''
  );

  const location = useTypedLocation();
  const [tokenData, setTokenData] = useState<ITokenData>({
    balance: location?.state?.tokenData?.balance ?? '',
    symbol: location?.state?.tokenData?.symbol ?? ''
  });

  const csprBalance = useSelector(selectAccountBalance, shallowEqual);
  const tokens = useSelector(selectErc20Tokens, shallowEqual);

  useEffect(() => {
    if (tokenData?.symbol === 'CSPR') {
      const balance =
        (csprBalance.amountMotes && motesToCSPR(csprBalance.amountMotes)) ||
        '0';
      setTokenData(prev => ({ ...prev, balance }));
    } else {
      const erc20Tokens = formatErc20TokenBalance(tokens);
      const balance =
        erc20Tokens?.find(t => t?.symbol === tokenData?.symbol)?.amount ?? '0';
      setTokenData(prev => ({ ...prev, balance }));
    }
  }, [csprBalance, tokenData?.symbol, tokens]);

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
              <QRCodeSVG
                value={activeAccount?.publicKey || ''}
                style={{
                  maxWidth: '296px',
                  maxHeight: '296px',
                  height: 'auto',
                  width: 'auto'
                }}
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
