import React from 'react';
import styled from 'styled-components';
import { ContentColor, getColorFromTheme, themeConfig } from '@src/libs/ui';

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
  hoverColor?: ContentColor;
  inline?: boolean;
}

type Ref = HTMLAnchorElement;
const StyledLink = styled.a<LinkProps>(
  ({ theme, color, hoverColor, inline }) => {
    const stateColor = getStateColor(color);
    const hover = hoverColor && getColorFromTheme(theme, hoverColor);

    return {
      display: inline ? 'inline' : 'flex',
      textDecoration: 'none',
      cursor: 'pointer',
      color: stateColor.color,
      '&:hover > *': {
        color: hover || stateColor.hover
      },
      '&:active > *': {
        color: stateColor.active
      }
    };
  }
);

export const Link = React.forwardRef<Ref, LinkProps>(function Link(props, ref) {
  return <StyledLink ref={ref} target={props.target} {...props} />;
});
