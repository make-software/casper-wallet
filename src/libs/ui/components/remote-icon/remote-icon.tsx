import React, { useEffect, useState } from 'react';
import styled from 'styled-components';

import { DeployIcon } from '@src/constants';

// By path, not through the barrel this component is itself exported from — that
// import would close a cycle.
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
 * Deliberately an <img> rather than SvgIcon: react-inlinesvg fetches the file (needing
 * a connect-src entry and a host permission) and injects it into the popup's DOM.
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

  // Rows are recycled, so an error latched from the previous url would hide a good icon.
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
      // Partial mitigation: the icon host can't tell which contract or token is on screen.
      referrerPolicy="no-referrer"
    />
  );
};
