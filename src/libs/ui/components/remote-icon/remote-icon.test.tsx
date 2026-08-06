import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

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
});
