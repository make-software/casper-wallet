import { IDexToken } from 'casper-wallet-core/src/domain/swap';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ThemeProvider } from 'styled-components';

import { lightTheme } from '@libs/ui/theme-config';

import { TokenSelectorRow } from './token-selector-row';

const token: IDexToken = {
  id: 'pkg-hash-1',
  name: 'Shiboo Coin',
  symbol: 'SHIBOO',
  // A remote (non-bundled) url so the row goes through RemoteIcon's <img>
  // branch, which renders in this repo's node-only jest without further setup.
  icon: 'https://example.com/shiboo.png',
  decimals: 9,
  packageHash: 'aa',
  isWhitelisted: true,
  isBlacklisted: false,
  fiatRates: null,
  totalValueLocked: null,
  volume24h: null
};

describe('TokenSelectorRow', () => {
  const render = (
    props: Partial<Parameters<typeof TokenSelectorRow>[0]> = {}
  ) =>
    renderToStaticMarkup(
      <ThemeProvider theme={lightTheme}>
        <TokenSelectorRow
          token={token}
          isSelected={false}
          onSelect={() => {}}
          {...props}
        />
      </ThemeProvider>
    );

  it('renders the symbol on the primary line and the name on the secondary line', () => {
    const html = render();

    expect(html).toContain('SHIBOO');
    expect(html).toContain('Shiboo Coin');
  });

  it('renders "Unlisted token" instead of the name when the token is unlisted', () => {
    const html = render({ isUnlisted: true });

    // The name still appears as the icon's title/tooltip; only the secondary
    // line (captionRegular) is asserted here, per the token's listed status.
    expect(html).toContain(
      '<span type="captionRegular" color="contentSecondary"'
    );
    expect(html).toContain('Unlisted token');
    expect(html).not.toMatch(/captionRegular"[^<]*>Shiboo Coin</);
  });
});
