import styled from 'styled-components';
import { Input } from 'reakit/Input';

interface TextFieldBaseProps {
  fullWidth: boolean;
}

export const TextFieldBase = styled(Input)<TextFieldBaseProps>`
  padding: 8px 16px;
  font-size: 15px;

  color: ${({ theme }) => theme.input.text.main};
  background: ${({ theme }) => theme.input.background};

  border-radius: 6px;
  border: 0;

  width: ${({ fullWidth }) => (fullWidth ? '100%' : 'inherit')};

  margin-top: ${({ theme }) => theme.input.marginTop}px;
  margin-bottom: ${({ theme }) => theme.input.marginBottom}px;

  &::placeholder {
    color: ${({ theme }) => theme.input.text.placeholder.main};
  }
`;
