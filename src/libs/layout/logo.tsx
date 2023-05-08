import React from 'react';
import { SvgIcon } from '@libs/ui';

interface LogoProps {
  onClick?: () => void;
}

export function Logo({ onClick }: LogoProps) {
  return (
    <SvgIcon
      onClick={onClick}
      size={50}
      color="contentOnFill"
      src="assets/icons/casper-wallet-logo.svg"
    />
  );
}
