import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ThemeProvider } from 'styled-components';

import { lightTheme } from '@libs/ui/theme-config';

import { ContractIcon } from './contract-icon';

describe('ContractIcon', () => {
  it('renders a remote url as a plain img, never as inline svg', () => {
    const html = renderToStaticMarkup(
      <ContractIcon
        contractIcon="https://casper-assets.s3.amazonaws.com/contracts/csprclick.svg"
        contractName="CSPR.click"
      />
    );

    expect(html).toContain('<img');
    expect(html).not.toContain('<svg');
  });

  it('routes a bundled asset path into SvgIcon, not img', () => {
    const html = renderToStaticMarkup(
      <ThemeProvider theme={lightTheme}>
        <ContractIcon
          contractIcon="assets/icons/generic.svg"
          contractName="CSPR.click"
        />
      </ThemeProvider>
    );

    expect(html).not.toContain('<img');
  });
});
