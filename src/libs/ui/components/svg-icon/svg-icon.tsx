import React from 'react';
import ReactSVG from 'react-inlinesvg';
import styled from 'styled-components';

import { Color, getColorFromTheme } from '@src/libs/ui';

type Ref = HTMLDivElement;

export interface SvgIconProps extends React.HTMLAttributes<Ref> {
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
  shouldForwardProp: (prop, defaultValidatorFn) =>
    !['flipByAxis'].includes(prop) && defaultValidatorFn(prop)
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

const StyledReactSVG = styled(ReactSVG)<SvgIconProps>(
  ({ size, width, height }) => ({
    display: 'flex',
    width: width != null ? width : size,
    height: height != null ? height : size
  })
);

export const SvgIcon = React.forwardRef<Ref, SvgIconProps>(
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
        />
      </Container>
    );
  }
);
