import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ThemeProvider } from 'styled-components';

import { lightTheme } from '@libs/ui/theme-config';

import { SvgIcon } from './svg-icon';

// react-inlinesvg only reaches its FAILED branch behind canUseDOM(), and this
// repo's jest environment is 'node' — the real component returns its `loader`
// and short-circuits before any of the failure handling runs. The stub stands
// in for exactly the two things the library documents on failure: it calls
// onError, and it renders the children it was given. This mirrors the
// documented behaviour of react-inlinesvg 4.5.0 (the version pinned in
// package.json as "^4.5.0") — a minor bump could change that branch without
// this suite noticing, since it asserts against the stub, not the library.
const mockInlineSvg = jest.fn();

jest.mock('react-inlinesvg', () => ({
  __esModule: true,
  default: (props: unknown) => mockInlineSvg(props)
}));

interface StubProps {
  onError?: (error: Error) => void;
  children?: React.ReactNode;
}

describe('SvgIcon', () => {
  let consoleError: jest.SpyInstance;

  const render = (src: string) =>
    renderToStaticMarkup(
      <ThemeProvider theme={lightTheme}>
        <SvgIcon src={src} />
      </ThemeProvider>
    );

  beforeEach(() => {
    consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    mockInlineSvg.mockReset();
  });

  afterEach(() => {
    consoleError.mockRestore();
  });

  // A bundled path throughout, so assertLocalIconSrc stays quiet and cannot be
  // mistaken for the assertion under test.
  it('reports the failure and renders the placeholder when the file fails to load', () => {
    mockInlineSvg.mockImplementation((props: StubProps) => {
      props.onError?.(new Error('Not found'));
      return props.children ?? null;
    });

    const html = render('assets/icons/failing-in-svg-icon-test.svg');

    expect(consoleError).toHaveBeenCalledTimes(1);
    expect(consoleError.mock.calls[0][0]).toContain('[SvgIcon:load]');
    expect(consoleError.mock.calls[0][0]).toContain(
      'assets/icons/failing-in-svg-icon-test.svg'
    );
    expect(html).toContain('data-testid="broken-icon-placeholder"');
  });

  it('renders the icon and reports nothing when the file loads', () => {
    mockInlineSvg.mockImplementation(() => <svg data-testid="loaded-icon" />);

    const html = render('assets/icons/loading-in-svg-icon-test.svg');

    expect(consoleError).not.toHaveBeenCalled();
    expect(html).toContain('data-testid="loaded-icon"');
    expect(html).not.toContain('data-testid="broken-icon-placeholder"');
  });
});
