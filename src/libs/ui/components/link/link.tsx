import React, { HTMLAttributes, forwardRef } from 'react';
import styled, { DefaultTheme } from 'styled-components';

import { getColorFromTheme } from '@libs/ui/utils';

type LinkColor = 'contentAction' | 'fillCritical' | 'inherit';

// TODO: do we need this?
const getStateColor = (theme: DefaultTheme, color: LinkColor) => {
  return (
    // @ts-ignore
    {
      contentAction: {
        color: getColorFromTheme(theme, 'contentAction'),
        hover: getColorFromTheme(theme, 'contentAction'),
        active: getColorFromTheme(theme, 'contentAction')
      },
      fillCritical: {
        color: getColorFromTheme(theme, 'fillCritical'),
        hover: getColorFromTheme(theme, 'fillCriticalHover'),
        active: getColorFromTheme(theme, 'fillCriticalClick')
      }
    }[color] || {
      color: 'inherit',
      hover: 'inherit',
      active: 'inherit'
    }
  );
};

export interface LinkProps extends HTMLAttributes<Ref> {
  href?: string;
  target?: string;
  color: LinkColor;
}

type Ref = HTMLAnchorElement;
const StyledLink = styled.a<LinkProps>(({ theme, color }) => {
  const stateColor = getStateColor(theme, color);

  return {
    textDecoration: 'none',
    cursor: 'pointer',
    color: stateColor.color,
    '&:hover > *': {
      color: stateColor.hover
    },
    '&:active > *': {
      color: stateColor.active
    }
  };
});

export const Link = forwardRef<Ref, LinkProps>(function Link(props, ref) {
  return <StyledLink ref={ref} target={props.target} {...props} />;
});
