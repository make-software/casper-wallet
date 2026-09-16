import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ThemeProvider } from 'styled-components';

import { lightTheme } from '@libs/ui/theme-config';

import { Input, InputProps } from './input';

// This barrel reaches 'mac-scrollbar', an ESM-only package jest cannot load.
jest.mock('@libs/layout', () => jest.requireActual('@libs/layout/containers'));

// list.tsx, re-exported here, imports 'mac-scrollbar' the same way.
jest.mock('@libs/ui/components', () => ({
  ...jest.requireActual('@libs/ui/components/typography/typography'),
  ...jest.requireActual('@libs/ui/components/form-field/form-field'),
  ...jest.requireActual('@libs/ui/components/svg-icon/svg-icon')
}));

// webextension-polyfill throws outside a real extension context.
jest.mock('webextension-polyfill', () => ({
  windows: {
    getCurrent: jest.fn(),
    remove: jest.fn()
  }
}));

// The real component short-circuits to `null` without a DOM; the stub renders
// `src` so the error-icon row is assertable.
jest.mock('react-inlinesvg', () => ({
  __esModule: true,
  default: (props: { src: string }) => (
    <svg data-testid="mock-svg-icon" data-src={props.src} />
  )
}));

describe('Input', () => {
  const render = (props: InputProps) =>
    renderToStaticMarkup(
      <ThemeProvider theme={lightTheme}>
        <Input {...props} />
      </ThemeProvider>
    );

  it('renders the warning text', () => {
    const html = render({ warning: true, validationText: 'Too high slippage' });

    expect(html).toContain('Too high slippage');
  });

  it('keeps the suffix visible alongside a warning', () => {
    const html = render({
      warning: true,
      validationText: 'x',
      suffixText: '%'
    });

    expect(html).toContain('x');
    expect(html).toContain('%');
  });

  it('hides the suffix when there is an error', () => {
    const html = render({ error: true, validationText: 'x', suffixText: '%' });

    expect(html).toContain('x');
    expect(html).not.toContain('%');
  });

  it('renders as an error when both error and warning are set', () => {
    const html = render({ error: true, warning: true, validationText: 'x' });

    expect(html).toContain('assets/icons/error.svg');
  });

  it('renders the suffix and no status text when neither flag is set', () => {
    const html = render({ suffixText: '%' });

    expect(html).toContain('%');
    expect(html).not.toContain('Too high slippage');
  });
});
