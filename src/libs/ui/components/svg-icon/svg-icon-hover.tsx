import React, { useState } from 'react';

import { ContentColor, SvgIconProps } from '@libs/ui';

import SvgIcon from './svg-icon';

interface SvgIconHoverProps extends SvgIconProps {
  hoverColor: ContentColor;
}

export const SvgIconHover = ({
  color,
  hoverColor,
  ...rest
}: SvgIconHoverProps) => {
  // In all SVG icons color sets as attribute and changes by js, so we can use CSS for styling.
  // This functionality helps us to change color props for SVG on hover
  const [isHover, setIsHover] = useState(false);

  return (
    <SvgIcon
      onMouseEnter={() => setIsHover(true)}
      onMouseLeave={() => setIsHover(false)}
      color={isHover ? hoverColor : color}
      {...rest}
    />
  );
};
