import styled from 'styled-components';
import { hexToRGBA } from '@libs/ui';

export const FadedOut = styled.span`
  position: relative;

  ::after {
    content: '';
    text-align: right;
    position: absolute;
    bottom: 0;
    right: 0;
    width: 70%;
    height: 1.2em;
    background: ${({ theme }) => `linear-gradient(
      to right,
      rgba(255, 255, 255, 0),
      ${hexToRGBA(theme.color.backgroundSecondary, '1')} 90%
    )`};
  }
`;
