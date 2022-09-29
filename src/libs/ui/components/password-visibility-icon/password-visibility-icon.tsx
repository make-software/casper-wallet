import { SvgIcon } from '@libs/ui';
import React from 'react';

export type PasswordInputType = 'password' | 'text';

interface PasswordVisibilityIconProps {
  passwordInputType: PasswordInputType;
  setPasswordInputType: (type: PasswordInputType) => void;
}

export function PasswordVisibilityIcon({
  passwordInputType,
  setPasswordInputType
}: PasswordVisibilityIconProps) {
  return (
    <SvgIcon
      onClick={() =>
        setPasswordInputType(
          passwordInputType === 'password' ? 'text' : 'password'
        )
      }
      src={
        passwordInputType === 'password'
          ? 'assets/icons/hide.svg'
          : 'assets/icons/show.svg'
      }
      size={20}
    />
  );
}
