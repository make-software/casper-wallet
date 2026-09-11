import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  DefaultTheme,
  ServerStyleSheet,
  ThemeProvider
} from 'styled-components';

import { darkTheme, lightTheme } from '@libs/ui/theme-config';

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
    expect(render()).not.toContain('Please select a different trading pair.');
  });

  const renderCss = (
    props: Partial<Parameters<typeof SwapBanner>[0]> = {},
    theme: DefaultTheme = lightTheme
  ) => {
    const sheet = new ServerStyleSheet();

    renderToStaticMarkup(
      sheet.collectStyles(
        <ThemeProvider theme={theme}>
          <SwapBanner variant="warning" title="Important" {...props} />
        </ThemeProvider>
      )
    );

    const css = sheet.getStyleTags();
    sheet.seal();

    return css;
  };

  it('tints the warning variant with the warning background', () => {
    expect(renderCss({ variant: 'warning' })).toContain(
      `background-color:${lightTheme.color.backgroundWarning}`
    );
  });

  it('tints the error variant with the critical background', () => {
    expect(renderCss({ variant: 'error' })).toContain(
      `background-color:${lightTheme.color.backgroundCritical}`
    );
  });

  it('takes the tint from the active theme', () => {
    expect(renderCss({ variant: 'warning' }, darkTheme)).toContain(
      `background-color:${darkTheme.color.backgroundWarning}`
    );
  });
});
