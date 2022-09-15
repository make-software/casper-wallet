import React from 'react';
import { SvgIcon } from '~src/libs/ui';

interface LogoProps {
  onClick?: () => void;
}

export function Logo({ onClick }: LogoProps) {
  return <SvgIcon onClick={onClick} size={40} src="assets/icons/logo.svg" />;
}
