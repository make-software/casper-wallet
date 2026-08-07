import React, { useEffect, useState } from 'react';
import styled from 'styled-components';

import { DeployIcon } from '@src/constants';

// Imported by path, not through the '@libs/ui/components' barrel this component
// is itself exported from — the barrel import would close an import cycle.
import { SvgIcon } from '@libs/ui/components/svg-icon/svg-icon';

import { nextHasError } from './next-icon-state';
import { resolveIconSrc } from './resolve-icon-src';

export interface RemoteIconProps {
  src?: string | null;
  size?: number;
  alt?: string | null;
  title?: string | null;
  /** A bundled `assets/icons/*.svg` path — it is inlined by SvgIcon. */
  fallbackSrc?: DeployIcon;
  className?: string;
  /** Rounds the icon, e.g. `100` for a fully circular token logo. */
  borderRadius?: number;
}

const Img = styled.img<{ size: number; $borderRadius?: number }>`
  width: ${({ size }) => size}px;
  height: ${({ size }) => size}px;
  /* Contract and token logos are not guaranteed to be square. */
  object-fit: contain;
  ${({ $borderRadius }) =>
    $borderRadius != null && `border-radius: ${$borderRadius}px;`}
`;

/**
 * Renders an icon whose url came from an API response.
 *
 * Deliberately an <img> rather than SvgIcon: SvgIcon is react-inlinesvg, which
 * fetches the file (so the host needs a connect-src entry and a host permission)
 * and injects it into the popup's DOM (so a third-party <style> inside the file
 * would apply document-wide). An <img> needs neither, and isolates the SVG.
 */
export const RemoteIcon = ({
  src,
  size = 24,
  alt,
  title,
  fallbackSrc,
  className,
  borderRadius
}: RemoteIconProps) => {
  const [hasError, setHasError] = useState(false);

  // Rows are recycled across different tokens and contracts. Without this the
  // error latched from the previous url would hide a perfectly good new icon.
  // The dependency array is what guarantees this only fires on a genuine src
  // change (that guarantee is React's, not nextHasError's); nextHasError just
  // names the resulting transition so it's assertable without a DOM.
  useEffect(() => {
    setHasError(prev => nextHasError(prev, { type: 'srcChanged' }));
  }, [src]);

  const resolved = resolveIconSrc({ src, fallbackSrc, hasError });

  if (resolved == null) {
    return null;
  }

  if (resolved.isFallback) {
    return <SvgIcon src={resolved.src} size={size} className={className} />;
  }

  return (
    <Img
      src={resolved.src}
      size={size}
      $borderRadius={borderRadius}
      alt={alt || ''}
      title={title || undefined}
      onError={() =>
        setHasError(prev => nextHasError(prev, { type: 'loadError' }))
      }
      className={className}
      // Partial mitigation only: strips the Referer header so the icon host
      // can't correlate a request with the page it came from (which contract
      // or token the wallet is showing, on signing screens included). The
      // full fix is routing these through image-proxy-cdn.make.services and
      // tightening img-src to that host, but the proxy 403s casper-assets
      // URLs today ("requested URL is not allowed") and re-allowing them
      // needs a backend-side decision — tracked as follow-up, not done here.
      referrerPolicy="no-referrer"
    />
  );
};
