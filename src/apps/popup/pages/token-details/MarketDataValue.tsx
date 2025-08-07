import { SupportedMarketDataProviders } from 'casper-wallet-core';
import React from 'react';

import { TokenType } from '@hooks/use-casper-token';

import { CenteredFlexRow } from '@libs/layout';
import { Button, Typography } from '@libs/ui/components';

interface IMarketDataValueProps {
  token: TokenType;
}

const priceProviderAssetsMap: Record<SupportedMarketDataProviders, string> = {
  CoinGecko: 'assets/icons/coingecko.png',
  FriendlyMarket: 'assets/icons/friendly-market.png'
};

export const MarketDataValue: React.FC<IMarketDataValueProps> = ({ token }) => (
  <CenteredFlexRow>
    {token.tokenPrice && (
      <Typography wordBreak={true} type="captionRegular">
        {`$${Number(token.tokenPrice).toLocaleString('en-US', {
          maximumFractionDigits: 10
        })}`}
      </Typography>
    )}
    {token.tokenPriceProvider && (
      <Button
        inline
        disabled={!token.tokenPriceProviderUrl}
        style={{ background: 'transparent', padding: 8 }}
        onClick={() => {
          if (token.tokenPriceProviderUrl) {
            window.open(token.tokenPriceProviderUrl, '_blank');
          }
        }}
      >
        <img
          alt={`${token.tokenPriceProvider} icon`}
          src={priceProviderAssetsMap[token.tokenPriceProvider]}
          width="20"
          height="20"
        />
      </Button>
    )}
  </CenteredFlexRow>
);
