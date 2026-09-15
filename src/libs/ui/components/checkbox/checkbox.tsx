import React, { type JSX } from 'react';
import styled from 'styled-components';

// Deep paths, not the '@libs/ui/components' barrel: the barrel re-exports the
// header, which pulls in webextension-polyfill and throws outside a browser
// extension context — including this repo's node-only jest. Keeping this file
// barrel-free lets swap's token selector reuse the checkbox.
import { SvgIcon } from '@libs/ui/components/svg-icon/svg-icon';
import { Typography } from '@libs/ui/components/typography/typography';
import { BaseProps } from '@libs/ui/types';

import FlexRow from '../flex-row/flex-row';

const StyledFlexRow = styled(FlexRow)<{
  checked?: boolean;
  disabled?: boolean;
}>(({ theme, checked, disabled }) => ({
  cursor: disabled ? 'default' : 'pointer',
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
      <CheckboxSvgIcon
        src={iconSrc}
        color={disabled ? 'contentSecondary' : 'contentAction'}
      />
      {label && (
        <Typography type="body" color="contentPrimary">
          {label}
        </Typography>
      )}
    </StyledFlexRow>
  );
}
