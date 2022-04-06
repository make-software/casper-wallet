import styled from 'styled-components';
import { Button } from 'reakit/Button';
import { ButtonColor } from '@src/ui-kit/Button/types';

interface ButtonBaseProps {
  fullWidth: boolean;
  color?: ButtonColor;
}

export const ButtonBase = styled(Button)<ButtonBaseProps>`
  width: ${({ fullWidth }) => (fullWidth ? '100%' : 'inherit')};
  padding: 8px 0 8px 0;

  font-size: 15px;
  font-weight: 600;

  border-radius: 6px;
  border: 0;

  margin-top: ${({ theme }) => theme.button.marginTop}px;
  margin-bottom: ${({ theme }) => theme.button.marginBottom}px;

  color: ${({ color, theme }) =>
    color ? theme.button.color[color].text : theme.button.color.main.text};
  background: ${({ color, theme }) =>
    color
      ? theme.button.color[color].background
      : theme.button.color.main.background};
`;
