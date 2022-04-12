import React from 'react';
import styled from 'styled-components';
import { themeConfig } from '../../theme-config';

type Color = 'primaryBlue' | 'primaryRed' | 'hash' | 'inherit';

const getStateColor = (color: Color) => {
  return (
    // @ts-ignore
    {
      primaryBlue: {
        color: themeConfig.color.blue,
        hover: themeConfig.color.blueShade20,
        active: themeConfig.color.blueShade30
      },
      primaryRed: {
        color: themeConfig.color.red,
        hover: themeConfig.color.redShade10,
        active: themeConfig.color.redShade20
      },
      hash: {
        color: themeConfig.color.blue,
        hover: themeConfig.color.red,
        active: themeConfig.color.redShade20
      }
    }[color] || {
      color: 'inherit',
      hover: 'inherit',
      active: 'inherit'
    }
  );
};

/* eslint-disable-next-line */
export interface LinkProps extends React.HTMLAttributes<Ref> {
  href?: string;
  target?: string;
  color: Color;
}

type Ref = HTMLAnchorElement;
const StyledLink = styled.a<LinkProps>(({ theme, color }) => {
  const stateColor = getStateColor(color);
  return {
    color: stateColor.color,
    '&:hover > *': {
      color: stateColor.hover
    },
    '&:active > *': {
      color: stateColor.active
    }
  };
});

export const Link = React.forwardRef<Ref, LinkProps>(function Link(props, ref) {
  return <StyledLink ref={ref} target="_blank" {...props} />;
});

export default Link;
