import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ServerStyleSheet } from 'styled-components';

import { RemoteIcon } from './remote-icon';

describe('RemoteIcon', () => {
  it('renders a remote url as a plain img, never as inline svg', () => {
    const html = renderToStaticMarkup(
      <RemoteIcon
        src="https://casper-assets.s3.amazonaws.com/contracts/csprclick.svg"
        alt="CSPR.click"
        title="CSPR.click"
      />
    );

    expect(html).toContain('<img');
    expect(html).toContain(
      'src="https://casper-assets.s3.amazonaws.com/contracts/csprclick.svg"'
    );
    expect(html).toContain('alt="CSPR.click"');
    expect(html).not.toContain('<svg');
  });

  it('renders nothing when there is no url and no fallback', () => {
    expect(renderToStaticMarkup(<RemoteIcon src={null} />)).toBe('');
    expect(renderToStaticMarkup(<RemoteIcon src="" />)).toBe('');
  });

  it('renders an empty alt when none is given, so the img is decorative', () => {
    const html = renderToStaticMarkup(
      <RemoteIcon src="https://example.com/a.png" />
    );

    expect(html).toContain('alt=""');
  });

  it('withholds the referrer from the icon request', () => {
    const html = renderToStaticMarkup(
      <RemoteIcon src="https://example.com/a.png" />
    );

    expect(html).toContain('referrerPolicy="no-referrer"');
  });

  it('is square by default and round when a borderRadius is given', () => {
    const squareSheet = new ServerStyleSheet();
    renderToStaticMarkup(
      squareSheet.collectStyles(<RemoteIcon src="https://example.com/a.png" />)
    );
    const squareCss = squareSheet.getStyleTags();

    const roundSheet = new ServerStyleSheet();
    renderToStaticMarkup(
      roundSheet.collectStyles(
        <RemoteIcon src="https://example.com/a.png" borderRadius={100} />
      )
    );
    const roundCss = roundSheet.getStyleTags();

    expect(squareCss).not.toContain('border-radius');
    expect(roundCss).toContain('border-radius:100px');
  });
});
