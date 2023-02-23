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
      stroke: checked ? theme.color.fillBlue : theme.color.fillTertiary
    }
  },
  span: {
    color: theme.color.contentPrimary
  }
}));

export interface CheckboxProps extends BaseProps {
  label?: string | JSX.Element;
  onChange?: (value?: any) => void;
  checked: boolean;
  disabled?: boolean;
  variant?: 'square' | 'circle';
}

export function Checkbox({
  checked,
  onChange,
  label,
  variant = 'circle',
  dataTestId
}: CheckboxProps) {
  const handleClick = (ev: ChangeEvent<HTMLInputElement>) => {
    onChange && onChange(!checked);
  };

  const iconSrc =
    variant === 'square'
      ? checked
        ? 'assets/icons/checkbox-square-checked.svg'
        : 'assets/icons/checkbox-square.svg'
      : checked
      ? 'assets/icons/checkbox-checked.svg'
      : 'assets/icons/checkbox.svg';

  return (
    <StyledFlexRow
      itemsSpacing={8}
      align="center"
      checked={checked}
      onClick={handleClick}
      data-testid={dataTestId}
    >
      <SvgIcon src={iconSrc} />
      {label && (
        <Typography type="body" color="contentPrimary">
          {label}
        </Typography>
      )}
    </StyledFlexRow>
  );
}

export default Checkbox;
