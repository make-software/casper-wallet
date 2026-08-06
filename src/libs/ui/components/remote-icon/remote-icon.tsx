import React, { useEffect, useState } from 'react';
import styled from 'styled-components';

// Imported by path, not through the '@libs/ui/components' barrel this component
// is itself exported from — the barrel import would close an import cycle.
import { SvgIcon } from '@libs/ui/components/svg-icon/svg-icon';

import { resolveIconSrc } from './resolve-icon-src';

export interface RemoteIconProps {
  src?: string | null;
  size?: number;
  alt?: string | null;
  title?: string | null;
  /** Bundled `assets/icons/*.svg` path only — it is inlined by SvgIcon. */
  fallbackSrc?: string;
  className?: string;
}

const Img = styled.img<{ size: number }>`
  width: ${({ size }) => size}px;
  height: ${({ size }) => size}px;
  /* Contract and token logos are not guaranteed to be square. */
  object-fit: contain;
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
  className
}: RemoteIconProps) => {
  const [hasError, setHasError] = useState(false);

  // Rows are recycled across different tokens and contracts. Without this the
  // error latched from the previous url would hide a perfectly good new icon.
  useEffect(() => {
    setHasError(false);
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
      alt={alt || ''}
      title={title || undefined}
      onError={() => setHasError(true)}
      className={className}
    />
  );
};
