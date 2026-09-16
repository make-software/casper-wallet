import { IDexToken } from 'casper-wallet-core/src/domain/swap';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ServerStyleSheet, ThemeProvider } from 'styled-components';

import { lightTheme } from '@libs/ui/theme-config';

import { TokenAmountCard, TokenAmountCardProps } from './token-amount-card';

const listedToken: IDexToken = {
  id: 'pkg-hash-1',
  name: 'Shiboo Coin',
  symbol: 'SHIBOO',
  icon: 'https://example.com/shiboo.png',
  decimals: 9,
  packageHash: 'aabbccddeeff00112233445566778899',
  isWhitelisted: true,
  isBlacklisted: false,
  fiatRates: null,
  totalValueLocked: null,
  volume24h: null
};

const unlistedToken: IDexToken = {
  ...listedToken,
  id: 'pkg-hash-2',
  symbol: 'FATSO',
  name: 'Fatso',
  isWhitelisted: false,
  isBlacklisted: false
};

describe('TokenAmountCard', () => {
  const render = (props: Partial<TokenAmountCardProps> = {}) =>
    renderToStaticMarkup(
      <ThemeProvider theme={lightTheme}>
        <TokenAmountCard
          position="first"
          token={null}
          amount=""
          fiatAmount="$0"
          decimals={9}
          onAmountChange={() => {}}
          onOpenSelector={() => {}}
          hasError={false}
          {...props}
        />
      </ThemeProvider>
    );

  const renderCss = (props: Partial<TokenAmountCardProps> = {}) => {
    const sheet = new ServerStyleSheet();

    renderToStaticMarkup(
      sheet.collectStyles(
        <ThemeProvider theme={lightTheme}>
          <TokenAmountCard
            position="first"
            token={listedToken}
            amount="500"
            fiatAmount="$1,000.00"
            decimals={9}
            onAmountChange={() => {}}
            onOpenSelector={() => {}}
            hasError={false}
            {...props}
          />
        </ThemeProvider>
      )
    );

    return sheet.getStyleTags();
  };

  it('renders "Choose token" when no token is chosen', () => {
    const html = render();

    expect(html).toContain('<span type="bodySemiBold" color="contentAction"');
    expect(html).toContain('Choose token');
    expect(html).not.toContain('Unlisted token');
  });

  // react-inlinesvg fetches the bundled placeholder in the browser; only its sized box is visible.
  it('keeps the icon slot filled when no token is chosen', () => {
    expect(render()).toContain('size="32"');
  });

  it('renders the symbol and no "Unlisted token" for a listed token', () => {
    const html = render({ token: listedToken });

    expect(html).toContain('SHIBOO');
    expect(html).not.toContain('Unlisted token');
  });

  it('renders the truncated package hash and "Unlisted token" for an unlisted token', () => {
    const html = render({ token: unlistedToken });

    expect(html).toContain('aabbc...78899');
    expect(html).toContain('Unlisted token');
    // The symbol still appears as the icon's alt text; only the primary label is asserted.
    expect(html).not.toMatch(/bodySemiBold"[^<]*>FATSO</);
  });

  it('does not render "Swap max" when onSwapMax is not provided', () => {
    const html = render();

    expect(html).not.toContain('Swap max');
  });

  it('renders "Swap max" when onSwapMax is provided', () => {
    const html = render({ onSwapMax: () => {} });

    expect(html).toContain('Swap max');
  });

  it('renders the given maxLabel in place of "Swap max"', () => {
    const html = render({ onSwapMax: () => {}, maxLabel: 'Unwrap max' });

    expect(html).toContain('Unwrap max');
    expect(html).not.toContain('Swap max');
  });

  it('renders the placeholder and fiat amount when the amount is empty', () => {
    const html = render({ amount: '', fiatAmount: '$0' });

    expect(html).toContain('placeholder="0.00"');
    expect(html).toContain('value=""');
    expect(html).toContain('$0');
  });

  it('renders the formatted amount and the given fiat amount', () => {
    const html = render({ amount: '500', fiatAmount: '$1,000.00' });

    expect(html).toContain('value="500"');
    expect(html).toContain('$1,000.00');
  });

  it('renders the amount in the critical colour when the card has an error', () => {
    expect(renderCss({ hasError: true })).toContain(
      `color:${lightTheme.color.contentActionCritical}`
    );
  });

  it('renders the amount in the primary colour when the card has no error', () => {
    const css = renderCss();

    expect(css).not.toContain(lightTheme.color.contentActionCritical);
    expect(css).toContain(`color:${lightTheme.color.contentPrimary}`);
  });
});
