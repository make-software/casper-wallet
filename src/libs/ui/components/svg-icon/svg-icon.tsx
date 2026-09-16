import isPropValid from '@emotion/is-prop-valid';
import React, { HTMLAttributes, forwardRef } from 'react';
import ReactSVG from 'react-inlinesvg';
import styled from 'styled-components';

import { Color, getColorFromTheme } from '@libs/ui/utils';

import { assertLocalIconSrc } from './assert-local-icon-src';
import { reportIconLoadFailure } from './report-icon-load-failure';

type Ref = HTMLDivElement;

export interface SvgIconProps extends HTMLAttributes<Ref> {
  className?: string;
  style?: React.CSSProperties;
  size?: number;
  width?: number | string;
  height?: number | string;
  src: string;
  alt?: string;
  onClick?: (ev: any) => void;
  onMouseDown?: (ev: any) => void;
  color?: Color;
  tooltip?: string;
  flipByAxis?: 'X' | 'Y';
  marginLeft?: 'small' | 'medium';
  marginRight?: 'small' | 'medium';
  dataTestId?: string;
}

const getMargin = (size?: 'small' | 'medium') => {
  switch (size) {
    case 'small':
      return 4;
    case 'medium':
      return 8;
    default:
      return 'initial';
  }
};

const Container = styled('div').withConfig({
  shouldForwardProp: prop => !['flipByAxis'].includes(prop) && isPropValid(prop)
})<{
  size: number;
  width?: string | number;
  height?: string | number;
  color?: Color;
  active?: boolean;
  flipByAxis?: 'X' | 'Y';
  marginLeft?: 'small' | 'medium';
  marginRight?: 'small' | 'medium';
  onClick?: (ev: any) => void;
}>(
  ({
    theme,
    size,
    width,
    height,
    color = 'inherit',
    flipByAxis,
    marginLeft,
    marginRight,
    onClick
  }) => ({
    display: 'inline-block',
    verticalAlign: 'middle',
    width: width != null ? width : size,
    height: height != null ? height : size,
    color: getColorFromTheme(theme, color),
    transform: flipByAxis ? `rotate${flipByAxis}(180deg)` : 'none',
    transition: 'transform 500ms ease',
    marginLeft: getMargin(marginLeft),
    marginRight: getMargin(marginRight),
    cursor: onClick ? 'pointer' : 'inherit'
  })
);

// Only the three props the callback below reads: the full SvgIconProps pulls in
// HTMLAttributes' `onError`, which no handler can satisfy alongside the library's.
const StyledReactSVG = styled(ReactSVG)<{
  size: number;
  width?: number | string;
  height?: number | string;
}>(({ size, width, height }) => ({
  display: 'flex',
  width: width != null ? width : size,
  height: height != null ? height : size
}));

/**
 * Literal JSX rather than an asset path: it must not fetch and must not route
 * back through SvgIcon, whose RemoteIcon error path could loop. The FAILED
 * branch drops StyledReactSVG's class, so the 100% sizes resolve on Container.
 */
const BrokenIconPlaceholder = () => (
  <svg
    viewBox="0 0 24 24"
    width="100%"
    height="100%"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.5}
    opacity={0.4}
    aria-hidden="true"
    focusable="false"
    data-testid="broken-icon-placeholder"
  >
    <rect x="3" y="3" width="18" height="18" rx="4" />
    <path d="M8 16 16 8" />
  </svg>
);

export const SvgIcon = forwardRef<Ref, SvgIconProps>(
  (
    {
      src,
      alt,
      size = 24,
      color,
      onClick,
      flipByAxis,
      height,
      width,
      dataTestId,
      ...props
    }: SvgIconProps,
    ref
  ) => {
    assertLocalIconSrc(src);

    const handleClick =
      onClick &&
      ((ev: any) => {
        onClick(ev);
      });

    const preProcessor = color
      ? (code: string): string =>
          code.replace(/fill=".*?"/g, 'fill="currentColor"')
      : (code: string): string => code;

    return (
      <Container
        ref={ref}
        title={alt}
        size={size}
        color={color}
        flipByAxis={flipByAxis}
        onClick={handleClick}
        width={width}
        height={height}
        data-testid={dataTestId}
        {...props}
      >
        <StyledReactSVG
          src={src}
          preProcessor={preProcessor}
          cacheRequests
          size={size}
          height={height}
          width={width}
          onError={error => reportIconLoadFailure(src, error)}
        >
          <BrokenIconPlaceholder />
        </StyledReactSVG>
      </Container>
    );
  }
);
