import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ThemeProvider } from 'styled-components';

import { lightTheme } from '@libs/ui/theme-config';

import { DeployContainerIcon } from './deploy-container-icon';

describe('DeployContainerIcon', () => {
  it('renders a remote url as a plain img, never as inline svg', () => {
    const html = renderToStaticMarkup(
      <DeployContainerIcon
        iconUrl="https://casper-assets.s3.amazonaws.com/tokens/generic.svg"
        title="Generic deploy"
      />
    );

    expect(html).toContain('<img');
    expect(html).not.toContain('<svg');
  });

  it('routes a bundled asset path into SvgIcon, not img', () => {
    const html = renderToStaticMarkup(
      <ThemeProvider theme={lightTheme}>
        <DeployContainerIcon
          iconUrl="assets/icons/generic.svg"
          title="Generic deploy"
        />
      </ThemeProvider>
    );

    expect(html).not.toContain('<img');
  });
});
