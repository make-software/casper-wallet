import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ThemeProvider } from 'styled-components';

import { lightTheme } from '@libs/ui/theme-config';

import { SwapBanner } from './swap-banner';

describe('SwapBanner', () => {
  const render = (props: Partial<Parameters<typeof SwapBanner>[0]> = {}) =>
    renderToStaticMarkup(
      <ThemeProvider theme={lightTheme}>
        <SwapBanner variant="warning" title="Important" {...props} />
      </ThemeProvider>
    );

  it('renders the warning variant title', () => {
    const html = render({ variant: 'warning', title: 'Important' });

    expect(html).toContain('Important');
  });

  it('renders the error variant title', () => {
    const html = render({
      variant: 'error',
      title: 'Trading quote wasn’t found'
    });

    expect(html).toContain('Trading quote wasn’t found');
  });

  it('renders the body when given', () => {
    const html = render({
      body: 'Please select a different trading pair.'
    });

    expect(html).toContain('Please select a different trading pair.');
  });

  it('omits the body when none is given', () => {
    const html = render();

    expect(html).not.toContain('captionRegular');
  });
});
