import React from 'react';
import ReactSVG from 'react-inlinesvg';
import styled from 'styled-components';

import { ContentColor, getColorFromTheme } from '@src/libs/ui';

type Ref = HTMLDivElement;

/* eslint-disable-next-line */

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
  color?: ContentColor;
  tooltip?: string;
  flipByAxis?: 'X' | 'Y';
  marginLeft?: 'small' | 'medium';
  marginRight?: 'small' | 'medium';
  verticalAlign?: string | null;
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
  color?: ContentColor;
  active?: boolean;
  flipByAxis?: 'X' | 'Y';
  marginLeft?: 'small' | 'medium';
  marginRight?: 'small' | 'medium';
  onClick?: (ev: any) => void;
  verticalAlign?: string | null;
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
    verticalAlign,
    onClick
  }) => ({
    display: 'inline-block',
    verticalAlign: verticalAlign != null ? verticalAlign : 'middle',
    width: width != null ? width : size,
    height: height != null ? height : size,
    color: getColorFromTheme(theme, color),
    svg: {
      display: 'block',
      fill: 'currentColor',
      color: getColorFromTheme(theme, color),
      width: width != null ? width : size,
      height: height != null ? height : size
    },
    transform: flipByAxis ? `rotate${flipByAxis}(180deg)` : 'none',
    transition: 'transform 500ms ease',
    marginLeft: getMargin(marginLeft),
    marginRight: getMargin(marginRight),
    cursor: onClick ? 'pointer' : 'inherit'
  })
);

const StyledReactSVG = styled(ReactSVG)(({ theme }) => ({
  display: 'flex'
}));

export const SvgIcon = React.forwardRef<Ref, SvgIconProps>(
  (
    { src, alt, size = 24, color, onClick, flipByAxis, ...props }: SvgIconProps,
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
        {...props}
      >
        <StyledReactSVG src={src} preProcessor={preProcessor} cacheRequests />
      </Container>
    );
  }
);

export default SvgIcon;
