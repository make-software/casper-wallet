import React, { type JSX } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import styled from 'styled-components';

import { NetworkSetting } from '@src/constants';
import { isSafariBuild } from '@src/utils';

import { formatCep18Tokens } from '@popup/pages/home/components/tokens-list/utils';
import { MarketDataValue } from '@popup/pages/token-details/MarketDataValue';
import { getTokenData } from '@popup/pages/token-details/utils';
import { RouterPath, useTypedLocation, useTypedNavigate } from '@popup/router';

import { selectActiveNetworkSetting } from '@background/redux/settings/selectors';

import { useCasperToken } from '@hooks/use-casper-token';

import {
  AlignedSpaceBetweenFlexRow,
  CenteredFlexColumn,
  CenteredFlexRow,
  SpacingSize
} from '@libs/layout';
import { useFetchCep18Tokens } from '@libs/services/cep18-service';
import {
  toSwapTokenId,
  useIsTokenSwappable
} from '@libs/services/swap-service';
import {
  Button,
  Hash,
  HashVariant,
  List,
  Skeleton,
  SvgIcon,
  TokenPlate,
  Typography
} from '@libs/ui/components';

const ListItemContainer = styled(AlignedSpaceBetweenFlexRow)`
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
  const initialTokenData = location.state?.tokenData ?? null;

  const { t } = useTranslation();
  const navigate = useTypedNavigate();
  const { tokenName } = useParams();
  const casperToken = useCasperToken();

  const network = useSelector(selectActiveNetworkSetting);
  const { cep18Tokens } = useFetchCep18Tokens();

  const tokenData = getTokenData(
    initialTokenData,
    cep18Tokens,
    casperToken,
    tokenName
  );

  const { isSwappable, isLoading: isLoadingSwappable } =
    useIsTokenSwappable(tokenData);

  const showBuy =
    tokenName === 'Casper' &&
    network === NetworkSetting.Mainnet &&
    !isSafariBuild;
  // The skeleton stands in the same slot as the resolved button, so either fills it.
  const showSwapSlot = isLoadingSwappable || isSwappable;
  // Send and Receive are unconditional. A fourth action does not fit the card at
  // the XXXL gap, so the row falls back to the unspaced layout the Home row uses.
  const footerActionCount = 2 + Number(showBuy) + Number(showSwapSlot);

  const getTokenInfoList = (): TokenInfoList[] => {
    if (tokenName === 'Casper' && casperToken) {
      return [
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
      ];
    } else {
      // CEP-18 token case
      const formatedCep18Tokens = formatCep18Tokens(cep18Tokens);

      const token =
        formatedCep18Tokens?.find(token => token.id === tokenName) ?? tokenData;

      return [
        { id: 1, name: 'Symbol', value: token?.symbol ?? '' },
        { id: 2, name: 'Decimals', value: (token?.decimals || 0).toString() },
        ...(token?.contractPackageHash
          ? [
              {
                id: 3,
                name: 'Contract package hash',
                value: (
                  <Hash
                    value={token.contractPackageHash}
                    variant={HashVariant.CaptionHash}
                    truncated
                    color="contentPrimary"
                  />
                )
              }
            ]
          : []),
        ...(Boolean(Number(token?.tokenPrice)) && token
          ? [
              {
                id: 4,
                name: 'Market Price',
                value: <MarketDataValue token={token} />
              }
            ]
          : [])
      ];
    }
  };

  return (
    <List
      contentTop={SpacingSize.Small}
      rows={getTokenInfoList()}
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
        <FooterItemContainer
          gap={footerActionCount > 3 ? SpacingSize.None : SpacingSize.XXXL}
        >
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
          {showBuy && (
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
          {isLoadingSwappable && (
            <ButtonContainer gap={SpacingSize.Medium}>
              <Skeleton circle width={48} height={48} />
              <Skeleton width={40} height={16} />
            </ButtonContainer>
          )}
          {!isLoadingSwappable && isSwappable && (
            <ButtonContainer
              gap={SpacingSize.Medium}
              onClick={() =>
                navigate(RouterPath.Swap, {
                  state: {
                    swapFromTokenId: toSwapTokenId(
                      tokenData?.contractPackageHash
                    )
                  }
                })
              }
            >
              <Button circle>
                <SvgIcon src="assets/icons/swap.svg" color="contentOnFill" />
              </Button>
              <Typography type="captionMedium" color="contentAction">
                <Trans t={t}>Swap</Trans>
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
