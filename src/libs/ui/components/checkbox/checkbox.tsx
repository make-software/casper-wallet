import React, { ChangeEvent } from 'react';
import styled from 'styled-components';

import { BaseProps } from '../../types';

import FlexRow from '../flex-row/flex-row';
import SvgIcon from '../svg-icon/svg-icon';
import { Typography } from '@src/libs/ui';

const StyledFlexRow = styled(FlexRow)<{
  checked?: boolean;
}>(({ theme, checked }) => ({
  cursor: 'pointer',
  width: 'fit-content',
  pointerEvents: 'auto',
  svg: {
    fill: checked ? theme.color.fillBlue : 'none',
    rect: {
      stroke: theme.color.fillBlue
    }
  },
  span: {
    color: theme.color.contentPrimary
  }
}));

export interface CheckboxProps extends BaseProps {
  label?: string;
  onChange?: (value?: any) => void;
  checked: boolean;
  disabled?: boolean;
}

export function Checkbox({ checked, onChange, label }: CheckboxProps) {
  const handleClick = (ev: ChangeEvent<HTMLInputElement>) => {
    onChange && onChange(!checked);
  };

  const iconSrc = checked
    ? 'assets/icons/checkbox-checked.svg'
    : 'assets/icons/checkbox.svg';

  return (
    <StyledFlexRow
      itemsSpacing={8}
      align="center"
      checked={checked}
      onClick={handleClick}
    >
      <SvgIcon src={iconSrc} size={24} />
      {label && (
        <Typography type="body" weight="regular" color="contentPrimary">
          {label}
        </Typography>
      )}
    </StyledFlexRow>
  );
}

export default Checkbox;
