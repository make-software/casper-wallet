import React from 'react';
import SkeletonLib from 'react-loading-skeleton';
import { SkeletonProps } from 'react-loading-skeleton/dist/Skeleton';
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
