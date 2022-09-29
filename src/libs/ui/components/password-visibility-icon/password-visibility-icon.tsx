import { SvgIcon } from '@libs/ui';
import React from 'react';
import styled from 'styled-components';

export type PasswordInputType = 'password' | 'text';

const InputIconContainer = styled.div`
  line-height: 1rem;
`;

interface PasswordVisibilityIconProps {
  passwordInputType: PasswordInputType;
  setPasswordInputType: (type: PasswordInputType) => void;
}

export function PasswordVisibilityIcon({
  passwordInputType,
  setPasswordInputType
}: PasswordVisibilityIconProps) {
  return (
    <InputIconContainer>
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
    </InputIconContainer>
  );
}
