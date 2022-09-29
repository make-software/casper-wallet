import { SvgIcon } from '@libs/ui';
import React from 'react';
import styled from 'styled-components';

export type InputType = 'password' | 'text';

const InputIconContainer = styled.div`
  line-height: 1rem;
`;

interface PasswordVisibilityIconProps {
  inputType: InputType;
  changeInputType: (type: InputType) => void;
}

export function PasswordVisibilityIcon({
  inputType,
  changeInputType
}: PasswordVisibilityIconProps) {
  if (inputType === 'password') {
    return (
      <InputIconContainer>
        <SvgIcon
          onClick={() => changeInputType('text')}
          src="assets/icons/hide.svg"
          size={20}
        />
      </InputIconContainer>
    );
  }

  return (
    <InputIconContainer>
      <SvgIcon
        onClick={() => changeInputType('password')}
        src="assets/icons/show.svg"
        size={20}
      />
    </InputIconContainer>
  );
}
