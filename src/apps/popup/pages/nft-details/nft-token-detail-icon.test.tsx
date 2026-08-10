import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ThemeProvider } from 'styled-components';

import { lightTheme } from '@libs/ui/theme-config';

import { NftTokenDetailIcon } from './nft-token-detail-icon';

describe('NftTokenDetailIcon', () => {
  it('renders a remote url as a plain img, never as inline svg', () => {
    const html = renderToStaticMarkup(
      <NftTokenDetailIcon
        image="https://casper-assets.s3.amazonaws.com/nfts/collection.svg"
        alt="CSPR.studio"
      />
    );

    expect(html).toContain('<img');
    expect(html).not.toContain('<svg');
  });

  it('routes a bundled asset path into SvgIcon, not img', () => {
    const html = renderToStaticMarkup(
      <ThemeProvider theme={lightTheme}>
        <NftTokenDetailIcon
          image="assets/icons/nft-contract-icon.svg"
          alt="CSPR.studio"
        />
      </ThemeProvider>
    );

    expect(html).not.toContain('<img');
  });
});
