import React from 'react';
import SkeletonLib, { SkeletonProps } from 'react-loading-skeleton';
import { useTheme } from 'styled-components';

export const Skeleton: React.FC<SkeletonProps> = ({
  baseColor,
  highlightColor,
  ...props
}) => {
  const theme = useTheme();

  return (
    <SkeletonLib
      baseColor={baseColor ?? theme.color.backgroundSecondary}
      highlightColor={highlightColor ?? theme.color.backgroundPrimary}
      {...props}
    />
  );
};
