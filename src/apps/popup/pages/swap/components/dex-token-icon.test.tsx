import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ThemeProvider } from 'styled-components';

import { lightTheme } from '@libs/ui/theme-config';

import { DexTokenIcon } from './dex-token-icon';

describe('DexTokenIcon', () => {
  // SvgIcon reads colors off the theme, so the bundled branch needs a provider.
  const render = (props: Parameters<typeof DexTokenIcon>[0]) =>
    renderToStaticMarkup(
      <ThemeProvider theme={lightTheme}>
        <DexTokenIcon {...props} />
      </ThemeProvider>
    );

  it('renders the trade API url as a remote img', () => {
    const html = render({
      icon: 'https://casperdelta.xyz/long.png',
      symbol: 'CD_LONG'
    });

    expect(html).toContain('src="https://casperdelta.xyz/long.png"');
    expect(html).toContain('alt="CD_LONG"');
  });

  // Without a fallback this rendered nothing at all and the row's text slid
  // into the icon's slot. react-inlinesvg fetches the bundled asset in the
  // browser, so only the sized box it renders into is visible from here.
  it('still occupies the icon slot when the token has no icon url', () => {
    const html = render({ icon: null, symbol: 'CD_LONG' });

    expect(html).not.toBe('');
    expect(html).toContain('size="32"');
    expect(html).not.toContain('<img');
  });

  it('titles the icon with the token name, falling back to the symbol', () => {
    expect(
      render({
        icon: 'https://example.com/a.png',
        symbol: 'CD_LONG',
        name: 'Casper Delta Long Token'
      })
    ).toContain('title="Casper Delta Long Token"');

    expect(
      render({ icon: 'https://example.com/a.png', symbol: 'CD_LONG' })
    ).toContain('title="CD_LONG"');
  });

  it('inlines a bundled asset path instead of requesting it', () => {
    const html = render({ icon: 'assets/icons/casper.svg', symbol: 'CSPR' });

    expect(html).not.toContain('<img');
  });
});
