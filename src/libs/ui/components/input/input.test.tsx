import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ThemeProvider } from 'styled-components';

import { lightTheme } from '@libs/ui/theme-config';

import { Input, InputProps } from './input';

// Input pulls in the `@libs/ui/components` barrel, which reaches `FormField`,
// which imports `FlexColumn` from the `@libs/layout` barrel rather than the
// deep `@libs/layout/containers` path. The barrel also re-exports
// popup-layout.tsx, which requires 'mac-scrollbar' — an ESM-only package
// jest's CJS resolver cannot load. Routing the barrel to the deep module
// (real `FlexColumn`, no popup-layout) sidesteps that without touching
// production code.
jest.mock('@libs/layout', () => jest.requireActual('@libs/layout/containers'));

// `@libs/ui/components`'s barrel also directly re-exports list.tsx, which
// imports 'mac-scrollbar' the same way. Routing to the three real deep
// modules Input/FormField actually need avoids loading the barrel's list.tsx.
jest.mock('@libs/ui/components', () => ({
  ...jest.requireActual('@libs/ui/components/typography/typography'),
  ...jest.requireActual('@libs/ui/components/form-field/form-field'),
  ...jest.requireActual('@libs/ui/components/svg-icon/svg-icon')
}));

// Input pulls in the `@libs/ui/components` barrel, which transitively reaches
// `@libs/layout`'s header and its background/close-current-window import —
// webextension-polyfill throws outside a real extension context. See
// background/utils.test.ts for the same pattern.
jest.mock('webextension-polyfill', () => ({
  windows: {
    getCurrent: jest.fn(),
    remove: jest.fn()
  }
}));

// react-inlinesvg only reaches its DOM-dependent branches behind canUseDOM(),
// and this repo's jest environment is 'node' — the real component would
// short-circuit to `null` before rendering anything. The stub renders the
// `src` it was given so the error-icon row can assert on the icon path.
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
