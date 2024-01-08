import React from 'react';
import styled from 'styled-components';

import { BaseProps, SvgIcon, Typography } from '@libs/ui';

import FlexRow from '../flex-row/flex-row';

const StyledFlexRow = styled(FlexRow)<{
  checked?: boolean;
  disabled?: boolean;
}>(({ theme, checked, disabled }) => ({
  cursor: 'pointer',
  width: 'fit-content',
  pointerEvents: 'auto',
  svg: {
    fill: checked ? theme.color.fillPrimary : 'none',
    rect: {
      stroke: checked ? theme.color.fillPrimary : theme.color.contentDisabled
    }
  },
  span: {
    color: disabled ? theme.color.contentSecondary : theme.color.contentPrimary
  }
}));

const CheckboxSvgIcon = styled(SvgIcon)`
  flex-shrink: 0;
`;

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
  dataTestId,
  disabled
}: CheckboxProps) {
  const handleClick = () => {
    if (disabled) return;

    onChange && onChange(!checked);
  };

  const iconSrc =
    variant === 'square'
      ? checked
        ? 'assets/icons/checkbox-square-checked.svg'
        : 'assets/icons/checkbox-square.svg'
      : checked
        ? 'assets/icons/radio-button-on.svg'
        : 'assets/icons/radio-button-off.svg';

  return (
    <StyledFlexRow
      itemsSpacing={8}
      align="center"
      checked={checked}
      onClick={handleClick}
      data-testid={dataTestId}
      disabled={disabled}
    >
      <CheckboxSvgIcon src={iconSrc} color="contentAction" />
      {label && (
        <Typography type="body" color="contentPrimary">
          {label}
        </Typography>
      )}
    </StyledFlexRow>
  );
}

export default Checkbox;
