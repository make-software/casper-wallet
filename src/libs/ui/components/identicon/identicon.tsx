import md5 from 'md5';
import React, { useEffect, useRef } from 'react';
import styled from 'styled-components';

interface RoundedIdenticonProps {
  displayContext?: 'header' | 'accountList';
  isActiveAccount?: boolean;
  isConnected?: boolean;
  size?: number;
  borderRadius?: number;
}

const RoundedIdenticon = styled.canvas<RoundedIdenticonProps>(
  ({
    theme,
    displayContext,
    isActiveAccount,
    isConnected,
    size,
    borderRadius
  }) => ({
    borderRadius: borderRadius ? borderRadius : theme.borderRadius.base,

    width: size,
    height: size,

    ...(displayContext === 'accountList' && {
      border: isActiveAccount
        ? `3px solid ${
            isConnected
              ? theme.color.contentPositive
              : theme.color.contentDisabled
          }`
        : `3px solid ${theme.color.backgroundPrimary}`
    })
  })
);

interface IdenticonProps {
  background: string;
  count?: number;
  padding?: number;
  size: number;
  value: string;
  displayContext?: 'header' | 'accountList';
  isActiveAccount?: boolean;
  isConnected?: boolean;
  borderRadius?: number;
}
export const Identicon = ({
  background,
  count = 5,
  value,
  size,
  padding = 0,
  displayContext,
  isActiveAccount,
  isConnected,
  borderRadius
}: IdenticonProps) => {
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const hash = md5(value);
    const block = Math.floor(size / count);
    const hashColor = hash.slice(0, 6);

    if (canvas && canvas.current) {
      canvas.current.width = block * count + padding;
      canvas.current.height = block * count + padding;
      const arr = hash.split('').map(el => {
        const element = parseInt(el, 16);

        return element < 8 ? 0 : 1;
      });

      const map = [];

      map[0] = map[4] = arr.slice(0, 5);
      map[1] = map[3] = arr.slice(5, 10);
      map[2] = arr.slice(10, 15);

      const ctx = canvas.current.getContext('2d');

      if (ctx) {
        ctx.imageSmoothingEnabled = false;
        ctx.clearRect(0, 0, canvas.current.width, canvas.current.height);

        map.forEach((row, i) => {
          row.forEach((el, j) => {
            if (el) {
              ctx.fillStyle = '#' + hashColor;
              ctx.fillRect(
                block * i + padding,
                block * j + padding,
                block - padding,
                block - padding
              );
            } else {
              ctx.fillStyle = background;
              ctx.fillRect(
                block * i + padding,
                block * j + padding,
                block - padding,
                block - padding
              );
            }
          });
        });
      }
    }
  }, [background, count, padding, size, value]);

  return (
    <RoundedIdenticon
      ref={canvas}
      size={size}
      displayContext={displayContext}
      isActiveAccount={isActiveAccount}
      isConnected={isConnected}
      borderRadius={borderRadius}
    />
  );
};
