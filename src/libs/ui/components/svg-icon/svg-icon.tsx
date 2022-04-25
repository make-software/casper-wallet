import React from 'react';
import ReactSVG from 'react-inlinesvg';
import styled from 'styled-components';

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
  color?: string;
  tooltip?: string;
  rotate?: boolean;
  marginLeft?: boolean;
  marginRight?: boolean;
}

const Container = styled('div').withConfig({
  shouldForwardProp: (prop, defaultValidatorFn) =>
    !['rotate'].includes(prop) && defaultValidatorFn(prop)
})<{
  size: number;
  width?: string | number;
  height?: string | number;
  color?: string;
  active?: boolean;
  rotate?: boolean;
  marginLeft?: boolean;
  marginRight?: boolean;
}>(
  ({ theme, size, width, height, color, rotate, marginLeft, marginRight }) => ({
    display: 'inline-block',
    verticalAlign: 'middle',
    width: width != null ? width : size,
    height: height != null ? height : size,
    color: color || 'inherit',
    svg: {
      display: 'block',
      fill: 'currentColor',
      color: color || 'inherit',
      width: width != null ? width : size,
      height: height != null ? height : size
    },
    transform: rotate ? 'rotateX(180deg)' : 'rotateX(0deg)',
    transition: 'transform 500ms ease',
    marginLeft: marginLeft ? 8 : 'initial',
    marginRight: marginRight ? 8 : 'initial'
  })
);

const StyledReactSVG = styled(ReactSVG)(({ theme }) => ({
  display: 'flex'
}));

export const SvgIcon = React.forwardRef<Ref, SvgIconProps>(
  (
    {
      src,
      alt,
      size = 16,
      color,
      onClick,
      rotate = false,
      ...props
    }: SvgIconProps,
    ref
  ) => {
    const handleClick = (ev: any) => {
      onClick && onClick(ev);
    };

    const preProcessor = color
      ? (code: string): string => code.replace(/fill=".*?"/g, `fill="${color}"`)
      : (code: string): string => code;
    // false ? code.replace(/fill=".*?"/g, 'fill="currentColor"') : code;

    return (
      <Container
        ref={ref}
        title={alt}
        size={size}
        color={color}
        rotate={rotate}
        onClick={handleClick}
        {...props}
      >
        <StyledReactSVG src={src} preProcessor={preProcessor} cacheRequests />
      </Container>
    );
  }
);

export default SvgIcon;
