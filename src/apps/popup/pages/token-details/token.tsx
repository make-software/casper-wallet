import React, { useEffect, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import styled from 'styled-components';

import { NetworkSetting } from '@src/constants';
import { isSafariBuild } from '@src/utils';

import { formatCep18Tokens } from '@popup/pages/home/components/tokens-list/utils';
import { MarketDataValue } from '@popup/pages/token-details/MarketDataValue';
import { RouterPath, useTypedLocation, useTypedNavigate } from '@popup/router';

import {
  selectActiveNetworkSetting,
  selectApiConfigBasedOnActiveNetwork
} from '@background/redux/settings/selectors';
import { selectVaultActiveAccount } from '@background/redux/vault/selectors';

import { TokenType, useCasperToken } from '@hooks/use-casper-token';

import {
  CenteredFlexColumn,
  CenteredFlexRow,
  SpaceBetweenFlexRow,
  SpacingSize
} from '@libs/layout';
import { useFetchCep18Tokens } from '@libs/services/cep18-service';
import {
  Button,
  List,
  SvgIcon,
  TokenPlate,
  Typography
} from '@libs/ui/components';

const ListItemContainer = styled(SpaceBetweenFlexRow)`
  padding: 16px;
`;

const FooterItemContainer = styled(CenteredFlexRow)`
  padding: 24px 0 16px;
`;

const ButtonContainer = styled(CenteredFlexColumn)`
  cursor: pointer;

  padding: 0 16px;
`;

type TokenInfoList = {
  id: number;
  name: string;
  value: string | JSX.Element;
};

export const Token = () => {
  const location = useTypedLocation();
  const [tokenData, setTokenData] = useState<TokenType | null>(
    location.state.tokenData ?? null
  );
  const [tokenInfoList, setTokenInfoList] = useState<TokenInfoList[] | []>([]);

  const { t } = useTranslation();
  const navigate = useTypedNavigate();
  const { tokenName } = useParams();
  const casperToken = useCasperToken();

  const { casperLiveUrl } = useSelector(selectApiConfigBasedOnActiveNetwork);
  const activeAccount = useSelector(selectVaultActiveAccount);
  const network = useSelector(selectActiveNetworkSetting);
  const { cep18Tokens } = useFetchCep18Tokens();

  useEffect(() => {
    if (tokenName === 'Casper') {
      // Casper Coin case
      if (casperToken && activeAccount) {
        setTokenData(casperToken);
        setTokenInfoList([
          { id: 1, name: 'Symbol', value: casperToken?.symbol },
          ...(casperToken.tokenPrice
            ? [
                {
                  id: 2,
                  name: 'Market Price',
                  value: <MarketDataValue token={casperToken} />
                }
              ]
            : [])
        ]);
      }
    } else {
      // CEP-18 token case
      const formatedCep18Tokens = formatCep18Tokens(cep18Tokens);

      const token = formatedCep18Tokens?.find(token => token.id === tokenName);

      if (token) {
        setTokenData(token);
        setTokenInfoList([
          { id: 1, name: 'Symbol', value: token?.symbol },
          { id: 2, name: 'Decimals', value: (token?.decimals || 0).toString() },
          ...(token.tokenPrice
            ? [
                {
                  id: 3,
                  name: 'Market Price',
                  value: <MarketDataValue token={token} />
                }
              ]
            : [])
        ]);
      } else {
        setTokenData(prev => (prev ? { ...prev, amount: '0' } : null));
        setTokenInfoList([
          { id: 1, name: 'Symbol', value: tokenData?.symbol ?? '' },
          {
            id: 2,
            name: 'Decimals',
            value: (tokenData?.decimals || 0).toString()
          },
          ...(tokenData?.tokenPrice
            ? [
                {
                  id: 3,
                  name: 'Market Price',
                  value: <MarketDataValue token={tokenData} />
                }
              ]
            : [])
        ]);
      }
    }
  }, [
    tokenName,
    casperToken,
    activeAccount,
    casperLiveUrl,
    cep18Tokens,
    tokenData?.symbol,
    tokenData?.decimals,
    tokenData?.tokenPrice
  ]);

  return (
    <List
      contentTop={SpacingSize.Small}
      rows={tokenInfoList}
      renderHeader={() => <TokenPlate token={tokenData} />}
      renderRow={({ name, value }) => (
        <ListItemContainer>
          <Typography type="captionRegular" color="contentSecondary">
            {name}
          </Typography>
          {typeof value === 'string' ? (
            <Typography wordBreak={true} type="captionRegular">
              {value}
            </Typography>
          ) : (
            value
          )}
        </ListItemContainer>
      )}
      renderFooter={() => (
        <FooterItemContainer gap={SpacingSize.XXXL}>
          <ButtonContainer
            gap={SpacingSize.Medium}
            onClick={() =>
              navigate(RouterPath.Transfer, { state: { tokenData } })
            }
          >
            <Button circle>
              <SvgIcon src="assets/icons/transfer.svg" color="contentOnFill" />
            </Button>
            <Typography type="captionMedium" color="contentAction">
              <Trans t={t}>Send</Trans>
            </Typography>
          </ButtonContainer>
          <ButtonContainer
            gap={SpacingSize.Medium}
            onClick={() =>
              navigate(RouterPath.Receive, { state: { tokenData } })
            }
          >
            <Button circle>
              <SvgIcon src="assets/icons/receive.svg" color="contentOnFill" />
            </Button>
            <Typography type="captionMedium" color="contentAction">
              <Trans t={t}>Receive</Trans>
            </Typography>
          </ButtonContainer>
          {tokenName === 'Casper' &&
            network === NetworkSetting.Mainnet &&
            !isSafariBuild && (
              <ButtonContainer
                gap={SpacingSize.Medium}
                onClick={() => navigate(RouterPath.BuyCSPR)}
              >
                <Button circle>
                  <SvgIcon src="assets/icons/card.svg" color="contentOnFill" />
                </Button>
                <Typography type="captionMedium" color="contentAction">
                  <Trans t={t}>Buy</Trans>
                </Typography>
              </ButtonContainer>
            )}
        </FooterItemContainer>
      )}
      marginLeftForItemSeparatorLine={16}
      marginLeftForHeaderSeparatorLine={64}
    />
  );
};
