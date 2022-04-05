import styled from 'styled-components';
import { TypographyAlign, TypographyColor } from './types';
import { Theme } from '@src/styles/types';

interface StyledTypographyProps {
  align: TypographyAlign;
  color: TypographyColor;
  fontSize: number;
  theme: Theme;
}

export const Paragraph = styled.p<StyledTypographyProps>`
  text-align: ${({ align }) => align};
  color: ${({ color, theme }) => theme.typography[color]};
  font-size: ${({ fontSize }) => `${fontSize}px`};
`;
