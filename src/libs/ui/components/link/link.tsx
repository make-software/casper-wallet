import React from 'react';
import styled from 'styled-components';
import { themeConfig } from '@src/libs/ui';

type LinkColor = 'fillBlue' | 'fillRed' | 'inherit';

const getStateColor = (color: LinkColor) => {
  return (
    // @ts-ignore
    {
      fillBlue: {
        color: themeConfig.color.fillBlue,
        hover: themeConfig.color.fillBlueHover,
        active: themeConfig.color.fillBlueClick
      },
      fillRed: {
        color: themeConfig.color.fillRed,
        hover: themeConfig.color.fillRedHover,
        active: themeConfig.color.fillRedClick
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
  color: LinkColor;
}

type Ref = HTMLAnchorElement;
const StyledLink = styled.a<LinkProps>(({ theme, color }) => {
  const stateColor = getStateColor(color);
  return {
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

export const Link = React.forwardRef<Ref, LinkProps>(function Link(props, ref) {
  return <StyledLink ref={ref} target="_blank" {...props} />;
});

export default Link;
